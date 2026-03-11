
import { Type } from "@google/genai";
import { FormSchema, FormFieldSchema, KanpoData, ApiConfig } from '../types';
import { BASE_SYSTEM_INSTRUCTION } from './prompts';
import * as geminiService from './geminiService';
import * as groqService from './groqService';
import * as perplexityService from './perplexityService';
import * as ollamaService from './ollamaService';


const generateFieldDescription = (field: FormFieldSchema): string => {
    // 1. Check for ※NULL Label (Null Enforcement Phase support)
    const isNullField = field.label.includes('※NULL') || (field.englishLabel && field.englishLabel.includes('※NULL'));
    if (isNullField) {
        return `*   **${field.name} (${field.label}):** INTERNAL FIELD. Leave blank/null.`;
    }

    // 2. Specific fixed values
    if (field.name === 'ソース区分') {
        return `*   **${field.name} (${field.label}):** Always output the half-width alphabet "K".`;
    }

    // 3. Programmatic Fields: Explicitly tell AI to ignore them
    if (['データID'].includes(field.name)) {
        return `*   **${field.name} (${field.label}):** IGNORE. Set programmatically. Return null or empty string.`;
    }
    if (['掲載日', '納品日', '掲載ページ'].includes(field.name)) {
        return `*   **${field.name} (${field.label}):** IGNORE. Set programmatically (System Logic). Return null.`;
    }

    // 4. Ignored Internal Fields: Explicitly tell AI to leave them blank
    const ignoredFields = [
        '企業CD', '支店コード', 
        'DBメンテ部署', '確認取材（フラグ）', '確認取材日', 
        'DBメンテ（フラグ）', 'DBメンテ日付', 
        'コメント欄', 'データ追加日（登録日）', 
        '事件種別', '事件日', '作業用確認コメント'
    ];
    if (ignoredFields.includes(field.name)) {
        return `*   **${field.name} (${field.label}):** INTERNAL FIELD. Leave blank/null.`;
    }
    
    // 5. Special Rule for Half-width Text (Field 8)
    if (field.name === '記事（半角）') {
        return `*   **${field.name} (${field.label}):** Extract the same text as "記事（全角）" but convert ALL full-width characters (numbers, alphabets, symbols, katakana) to half-width.`;
    }

    // 6. Special Rule for Field 20 (Legal Entity Type)
    if (field.name === '法人格区分') {
        return `*   **${field.name} (${field.label}):** Analyze the text in "記事（全角）" and match it against the "Classification Rules for Field 20 (法人格区分)" defined above. Output the corresponding 2-digit code (e.g., "01", "02", "21").`;
    }

    // 7. Standard Fields: Generate standard extraction instructions
    let description = `*   **${field.name} (${field.label}):** Extract the relevant information for this field.`;
    if (field.placeholder) {
        description += ` For example: "${field.placeholder}".`;
    }
    if (field.type === 'select' && field.options) {
        const optionsStr = field.options.map(o => `"${o.value}" (for "${o.label}")`).join(', ');
        description += ` The value should be one of: ${optionsStr}.`;
    }
    return description;
};

export const generateSystemPrompt = (schema: FormSchema, customBasePrompt: string): string => {
    const fieldInstructions = schema.flatMap(fs => fs.fields).map(generateFieldDescription).join('\n');
    return `${customBasePrompt}\n\n### Detailed Field Extraction Rules\n${fieldInstructions}`;
};

export const formSchemaToGeminiSchema = (schema: FormSchema) => {
    const properties: Record<string, any> = {};
    schema.flatMap(fs => fs.fields).forEach(field => {
        // Skip sending schema properties for NULL fields to save tokens/confusion, 
        // but we need to keep structure consistent if the AI decides to output them anyway (as null).
        // Keeping them nullable is safe.
        properties[field.name] = {
            type: Type.STRING,
            description: `The extracted data for "${field.label}".`,
            nullable: true
        };
    });
    return {
        type: Type.OBJECT,
        properties,
        required: []
    };
};

// Helper: Wait function for backoff
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper: Retry wrapper
async function withRetry<T>(
    fn: () => Promise<T>, 
    retries = 3, 
    delay = 2000, 
    factor = 2
): Promise<T> {
    try {
        return await fn();
    } catch (error: any) {
        if (retries <= 0) throw error;
        
        // Check if error is worth retrying (Network errors, 429 Rate Limit, 5xx Server Errors)
        const isRetryable = 
            error.message.includes('429') || 
            error.message.includes('503') || 
            error.message.includes('500') ||
            error.message.includes('Network Error') ||
            error.message.includes('Failed to fetch');

        if (!isRetryable) throw error;

        console.warn(`API Call failed. Retrying in ${delay}ms... (${retries} attempts left). Error: ${error.message}`);
        await wait(delay);
        return withRetry(fn, retries - 1, delay * factor, factor);
    }
}

export async function extractDataWithAI(
    base64Image: string,
    mimeType: string,
    schema: FormSchema,
    apiConfig: ApiConfig,
    systemPrompt: string,
): Promise<Partial<KanpoData>> {
    const { provider, apiKey, model, ollamaUrl, ollamaModel } = apiConfig;

    if (provider !== 'ollama' && (!apiKey || apiKey.trim() === '')) {
        throw new Error("API Key is not set. Please add it in the settings.");
    }
    
    const extractionTask = async () => {
        switch (provider) {
            case 'gemini':
                const geminiSchema = formSchemaToGeminiSchema(schema);
                return await geminiService.extractDataFromImage(base64Image, mimeType, apiKey!, model, systemPrompt, geminiSchema);
            
            case 'groq':
                return await groqService.extractDataFromImage(base64Image, mimeType, apiKey!, model, systemPrompt);
            
            case 'perplexity':
                return await perplexityService.extractDataFromImage(base64Image, mimeType, apiKey!, model, systemPrompt);

            case 'ollama':
                return await ollamaService.extractDataFromImage(base64Image, mimeType, ollamaUrl, ollamaModel, systemPrompt);

            default:
                throw new Error(`Unsupported provider: ${provider}`);
        }
    };

    try {
        // Use the retry mechanism
        return await withRetry(extractionTask);
    } catch (error) {
        if (error instanceof Error) {
            // Check for common, user-actionable errors
            if (error.message.includes('401') || error.message.includes('API key') || error.message.includes('permission denied')) {
                throw new Error(`Authentication Error: The API key for ${provider} seems to be invalid. Please check your settings.`);
            }
            if (error.message.includes('429')) {
                throw new Error(`Rate Limit Exceeded: You are sending requests too fast for the ${provider} API. Please wait a moment.`);
            }
            if (error.message.toLowerCase().includes('failed to fetch')) {
                 throw new Error("Network Error: Could not connect to the AI service. Check your internet connection or if a CORS policy is blocking the request.");
            }
        }
        // Re-throw the original or a generic error if it's not a known type
        throw error;
    }
}
