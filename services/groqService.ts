import { KanpoData } from '../types';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

async function handleApiResponse(response: Response) {
    if (!response.ok) {
        let message = `HTTP error! status: ${response.status}`;
        try {
            const errorJson = await response.json();
            message = errorJson?.error?.message || response.statusText;
        } catch (e) {
            // Not a JSON error, use the raw text if available
            const errorText = await response.text();
            if (errorText) message = errorText;
        }
        throw new Error(message);
    }
    return response.json();
}

export async function extractDataFromImage(base64Image: string, mimeType: string, apiKey: string, model: string, systemInstruction: string): Promise<Partial<KanpoData>> {
    if (!apiKey) {
        throw new Error("Groq API Key is not set. Please add it in the settings.");
    }
    
    const requestBody = {
        model: model,
        messages: [
            {
                role: "system",
                content: systemInstruction
            },
            {
                role: "user",
                content: [
                    {
                        type: "text",
                        text: "Extract the data from this image according to your instructions. Respond with only a valid JSON object."
                    },
                    {
                        type: "image_url",
                        image_url: {
                            url: `data:${mimeType};base64,${base64Image}`
                        }
                    }
                ]
            }
        ],
        temperature: 0,
        response_format: {
            type: "json_object"
        }
    };

    const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(requestBody)
    });

    const data = await handleApiResponse(response);

    try {
        const jsonString = data.choices[0].message.content.trim();
        const parsedJson = JSON.parse(jsonString);
        return parsedJson as Partial<KanpoData>;
    } catch (e) {
        console.error("Failed to parse JSON response:", data.choices[0]?.message?.content);
        throw new Error("Received an invalid JSON response from the AI. The model may have failed to follow instructions.");
    }
}