import { KanpoData } from '../types';

async function handleApiResponse(response: Response) {
    if (!response.ok) {
        let message = `HTTP error! status: ${response.status}`;
        try {
            const errorJson = await response.json();
            message = errorJson?.error?.message || errorJson?.error || response.statusText;
        } catch (e) {
            // Not a JSON error, use the raw text if available
            const errorText = await response.text();
            if (errorText) message = errorText;
        }
        throw new Error(message);
    }
    return response.json();
}

export async function extractDataFromImage(
    base64Image: string, 
    mimeType: string, 
    ollamaUrl: string, 
    modelName: string, 
    systemInstruction: string
): Promise<Partial<KanpoData>> {
    if (!ollamaUrl || !modelName) {
        throw new Error("Ollama URL or model name is not configured.");
    }

    const OLLAMA_API_URL = `${ollamaUrl.replace(/\/$/, '')}/api/generate`;

    const requestBody = {
        model: modelName,
        system: systemInstruction,
        prompt: "Extract the data from this image according to your instructions. Respond with only a valid JSON object.",
        images: [base64Image],
        format: "json",
        stream: false,
    };

    const response = await fetch(OLLAMA_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
    });

    const data = await handleApiResponse(response);

    try {
        // Ollama with format: 'json' returns a JSON string in the 'response' field.
        const jsonString = data.response.trim();
        const parsedJson = JSON.parse(jsonString);
        return parsedJson as Partial<KanpoData>;
    } catch (e) {
        console.error("Failed to parse JSON response from Ollama:", data.response);
        throw new Error("Received an invalid JSON response from Ollama. The model may have failed to follow instructions or may not be suitable for JSON output.");
    }
}