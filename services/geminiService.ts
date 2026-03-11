import { GoogleGenAI } from "@google/genai";
import { KanpoData } from '../types';

export async function extractDataFromImage(base64Image: string, mimeType: string, apiKey: string, model: string, systemInstruction: string, responseSchema: any): Promise<Partial<KanpoData>> {
    if (!apiKey) {
        throw new Error("API Key is not set. Please add it in the settings.");
    }
    const ai = new GoogleGenAI({ apiKey });

    const imagePart = {
        inlineData: {
            data: base64Image,
            mimeType: mimeType,
        },
    };
    
    const textPart = {
        text: "Extract the data from this image according to your instructions and the provided JSON schema."
    };
    
    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: { parts: [imagePart, textPart] },
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            },
        });

        const jsonString = response.text.trim();
        const parsedJson = JSON.parse(jsonString);
        return parsedJson as Partial<KanpoData>;

    } catch (e: any) {
        console.error("Gemini API Error:", e);
        // Pass a more specific error message up the chain
        if (e.message) {
            throw new Error(`Gemini AI Error: ${e.message}`);
        }
        throw new Error("An unknown error occurred while contacting the Gemini AI service.");
    }
}