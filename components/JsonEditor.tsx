
import React, { useState, useEffect } from 'react';
import { KanpoData } from '../types';
import { CopyIcon, CheckIcon, SparklesIcon, PasteIcon, TrashIcon, RefreshIcon } from './icons';

interface JsonEditorProps {
    jsonData: KanpoData;
    onJsonChange: (newData: KanpoData) => void;
    onBulkJsonChange?: (bulkData: Record<string, KanpoData> | KanpoData[]) => void;
    addToast: (message: string, type: 'success' | 'error') => void;
}

const JsonEditor: React.FC<JsonEditorProps> = ({ jsonData, onJsonChange, onBulkJsonChange, addToast }) => {
    const [jsonText, setJsonText] = useState('');
    const [isCopied, setIsCopied] = useState(false);

    useEffect(() => {
        setJsonText(JSON.stringify(jsonData, null, 2));
    }, [jsonData]);

    const handleApply = () => {
        let cleanText = jsonText.trim();
        
        // Remove Markdown code blocks if present (e.g. ```json ... ```)
        cleanText = cleanText.replace(/```json/g, '').replace(/```/g, '');

        let parsedData: any = null;

        try {
            // Attempt 1: Standard JSON parse
            parsedData = JSON.parse(cleanText);
        } catch (error) {
            // Attempt 2: Handle "Concatenated JSON" (e.g. { ... }\n{ ... } or { ... }, { ... })
            try {
                const repairedText = '[' + cleanText.replace(/}\s*,?\s*{/g, '},{') + ']';
                parsedData = JSON.parse(repairedText);
                addToast("Detected multiple objects. Converted to batch update.", 'success');
            } catch (repairError) {
                 console.error("JSON Parse Error:", error);
                 addToast("The provided text is not valid JSON.", 'error');
                 return;
            }
        }

        if (!parsedData) return;

        // --- NEW: Intelligent Unwrapping ---
        // Check if the object wraps an array in a single property (e.g., { "result": [...] })
        if (!Array.isArray(parsedData) && typeof parsedData === 'object' && parsedData !== null) {
            const keys = Object.keys(parsedData);
            if (keys.length === 1 && Array.isArray(parsedData[keys[0]])) {
                parsedData = parsedData[keys[0]];
                addToast(`Unwrapped array from property "${keys[0]}".`, 'success');
            }
        }
        // -----------------------------------
            
        // 1. Check if Array (Bulk)
        if (Array.isArray(parsedData)) {
            if (onBulkJsonChange) {
                onBulkJsonChange(parsedData);
            } else {
                addToast("Bulk update (Array) is not supported in this context.", 'error');
            }
            return;
        }

        // 2. Check if Object Map (Bulk)
        // Heuristic: If values are objects and it doesn't look like a single KanpoData record
        const keys = Object.keys(parsedData);
        if (keys.length > 0) {
            const firstValue = parsedData[keys[0]];
            // KanpoData usually has specific keys. Let's check if the ROOT has them.
            // If root doesn't have 'verificationStatus' but the child does, it's likely a map.
            const rootIsRecord = 'verificationStatus' in parsedData || '内容要約欄' in parsedData || 'データID' in parsedData;
            const childIsRecord = typeof firstValue === 'object' && firstValue !== null && !Array.isArray(firstValue) && 
                                 ('verificationStatus' in firstValue || '内容要約欄' in firstValue || 'データID' in firstValue);

            if (!rootIsRecord && childIsRecord && onBulkJsonChange) {
                    onBulkJsonChange(parsedData as Record<string, KanpoData>);
                    return;
            }
        }

        // 3. Default to Single Record
        onJsonChange(parsedData);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(jsonText).then(() => {
            setIsCopied(true);
            addToast("JSON copied to clipboard!", "success");
            setTimeout(() => setIsCopied(false), 2000);
        }, () => {
            addToast("Failed to copy JSON.", "error");
        });
    };

    const handlePaste = async () => {
        if (!window.isSecureContext) {
            addToast("Automatic paste is disabled on non-secure (http://) pages. Please use Ctrl+V to paste manually.", 'error');
            return;
        }

        if (!navigator.clipboard?.readText) {
            addToast("Clipboard API not supported in this browser. Please use Ctrl+V to paste manually.", 'error');
            return;
        }
        
        try {
            const text = await navigator.clipboard.readText();
            if (text) {
                setJsonText(text);
                addToast("Pasted from clipboard.", 'success');
            } else {
                addToast("Clipboard is empty or contains no text.", 'error');
            }
        } catch (err) {
            console.error('Failed to read clipboard contents: ', err);
            if (err instanceof Error && err.name === 'NotAllowedError') {
                 addToast("Clipboard permission denied. Please allow access or paste manually.", 'error');
            } else {
                 addToast("Could not paste. Please try pasting manually (e.g., Ctrl+V).", 'error');
            }
        }
    };

    const handleClear = () => {
        setJsonText('');
    };

    const handleReload = () => {
        setJsonText(JSON.stringify(jsonData, null, 2));
        addToast("JSON reloaded from form data.", 'success');
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">JSON Data</h3>
                <div className="flex items-center space-x-1">
                     <button
                        onClick={handleReload}
                        className="p-2 rounded-md text-blue-500 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        aria-label="Reload JSON from form"
                        title="Reload from Form"
                    >
                        <RefreshIcon className="h-5 w-5" />
                    </button>
                     <button
                        onClick={handlePaste}
                        className="p-2 rounded-md text-green-500 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        aria-label="Paste JSON from clipboard"
                        title="Paste from Clipboard"
                    >
                        <PasteIcon className="h-5 w-5" />
                    </button>
                     <button
                        onClick={handleClear}
                        className="p-2 rounded-md text-red-500 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        aria-label="Clear JSON text"
                        title="Clear Text"
                    >
                        <TrashIcon className="h-5 w-5" />
                    </button>
                    <button
                        onClick={handleCopy}
                        className="p-2 rounded-md text-sky-500 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        aria-label="Copy JSON"
                        title="Copy JSON"
                    >
                        {isCopied ? <CheckIcon className="h-5 w-5 text-green-500" /> : <CopyIcon className="h-5 w-5" />}
                    </button>
                </div>
            </div>
            <textarea
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                className="block w-full flex-1 p-3 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm font-mono text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Paste JSON here. You can paste multiple objects (e.g. from AI Chat) and we will handle them!"
                spellCheck="false"
                aria-label="JSON Data Editor"
            />
            <div className="mt-4">
                <button
                    onClick={handleApply}
                    className="w-full flex items-center justify-center px-4 py-3 bg-indigo-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                >
                    <SparklesIcon className="h-5 w-5 mr-2" />
                    Apply JSON to Form
                </button>
            </div>
        </div>
    );
};

export default JsonEditor;
