
import React, { useState, useEffect } from 'react';
import { KeyIcon, EyeIcon, EyeOffIcon, InfoIcon } from './icons';

export type ApiProvider = 'gemini' | 'groq' | 'perplexity' | 'ollama';

interface ApiProviderManagerProps {
  selectedProvider: ApiProvider;
  onProviderChange: (provider: ApiProvider) => void;
  apiKey: string | null;
  onApiKeyChange: (key: string | null) => void;
  selectedModel: string;
  onModelChange: (model: string) => void;
  ollamaUrl: string;
  ollamaModel: string;
  onOllamaConfigChange: (url: string, model: string) => void;
}

export const PROVIDER_CONFIG: Record<ApiProvider, { name: string; models: string[] }> = {
  gemini: { name: 'Google Gemini', models: ['gemini-2.5-flash'] },
  groq: { name: 'Groq', models: ['llama3-70b-8192', 'llama3-8b-8192', 'mixtral-8x7b-32768'] },
  perplexity: { name: 'Perplexity AI', models: ['llama-3-sonar-large-32k-online', 'llama-3-sonar-small-32k-online'] },
  ollama: { name: 'Ollama (Local)', models: [] }, // Ollama models are user-defined
};


const ApiProviderManager: React.FC<ApiProviderManagerProps> = ({ 
    selectedProvider, onProviderChange, apiKey, onApiKeyChange,
    selectedModel, onModelChange,
    ollamaUrl, ollamaModel, onOllamaConfigChange
}) => {
  const [localApiKey, setLocalApiKey] = useState(apiKey || '');
  const [showKey, setShowKey] = useState(false);
  const [localOllamaUrl, setLocalOllamaUrl] = useState(ollamaUrl);
  const [localOllamaModel, setLocalOllamaModel] = useState(ollamaModel);

  useEffect(() => {
    setLocalApiKey(apiKey || '');
    setShowKey(false);
  }, [apiKey, selectedProvider]);

  useEffect(() => {
    setLocalOllamaUrl(ollamaUrl);
    setLocalOllamaModel(ollamaModel);
  }, [ollamaUrl, ollamaModel]);


  const handleSaveKey = () => {
    onApiKeyChange(localApiKey);
  };
  
  const handleClearKey = () => {
    onApiKeyChange(null);
    setLocalApiKey('');
  };

  const handleSaveOllama = () => {
    onOllamaConfigChange(localOllamaUrl, localOllamaModel);
  }

  const isKeySaved = apiKey === localApiKey;
  const isOllamaSaved = ollamaUrl === localOllamaUrl && ollamaModel === localOllamaModel;

  const currentProviderConfig = PROVIDER_CONFIG[selectedProvider];

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">AI Provider Configuration</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
            Select an AI provider, choose a model, and manage your settings.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Provider</label>
            <select
                value={selectedProvider}
                onChange={(e) => onProviderChange(e.target.value as ApiProvider)}
                className="block w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900 dark:text-white"
                aria-label="Select AI Provider"
            >
                {Object.entries(PROVIDER_CONFIG).map(([key, config]) => (
                    <option key={key} value={key}>{config.name}</option>
                ))}
            </select>
        </div>
        {currentProviderConfig.models.length > 0 && (
            <div>
                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Model</label>
                <select
                    value={selectedModel}
                    onChange={(e) => onModelChange(e.target.value)}
                    className="block w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900 dark:text-white"
                    aria-label="Select AI Model"
                >
                    {currentProviderConfig.models.map(model => (
                        <option key={model} value={model}>{model}</option>
                    ))}
                </select>
            </div>
        )}
      </div>

      {/* Information Box for Google Gemini Free Tier */}
      {selectedProvider === 'gemini' && (
        <div className="mt-2 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
            <div className="flex items-start">
                <InfoIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="ml-3">
                    <h4 className="text-sm font-bold text-blue-800 dark:text-blue-200">Free Developer API Key Limits</h4>
                    <div className="mt-2 text-sm text-blue-700 dark:text-blue-300 space-y-2">
                        <p>If you are using a free key (unpaid tier), please be aware of the following limitations:</p>
                        <ul className="list-disc list-inside pl-1 space-y-1 text-xs sm:text-sm">
                            <li><strong>Requests Per Minute (RPM):</strong> ~15 requests</li>
                            <li><strong>Requests Per Day (RPD):</strong> ~1,500 requests</li>
                            <li><strong>Tokens Per Minute (TPM):</strong> 1 million tokens</li>
                        </ul>
                        <div className="mt-2 pt-2 border-t border-blue-200 dark:border-blue-800">
                            <p className="font-semibold text-xs text-blue-800 dark:text-blue-200 uppercase">Data Privacy Warning</p>
                            <p className="text-xs mt-1">Google may use input/output data from the free tier to improve their models. <span className="font-bold">Do not use sensitive or private data.</span></p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}
      
      {selectedProvider === 'ollama' ? (
        <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">Ollama Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label htmlFor="ollama-url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Server URL</label>
                    <input
                        type="text"
                        id="ollama-url"
                        value={localOllamaUrl}
                        onChange={(e) => setLocalOllamaUrl(e.target.value)}
                        placeholder="http://localhost:11434"
                        className="block w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900 dark:text-white"
                    />
                 </div>
                 <div>
                    <label htmlFor="ollama-model" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Model Name</label>
                    <input
                        type="text"
                        id="ollama-model"
                        value={localOllamaModel}
                        onChange={(e) => setLocalOllamaModel(e.target.value)}
                        placeholder="e.g., llava, moondream"
                        className="block w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900 dark:text-white"
                    />
                 </div>
            </div>
            {!isOllamaSaved && (
                <div className="flex justify-end">
                    <button onClick={handleSaveOllama} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 font-medium">
                        Save Ollama Settings
                    </button>
                </div>
            )}
        </div>
      ) : (
        <div className="space-y-2 pt-4 border-t border-gray-200 dark:border-gray-700">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">API Key</label>
          <div className="flex items-center space-x-2">
            <div className="relative flex-grow">
              <KeyIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type={showKey ? 'text' : 'password'}
                value={localApiKey}
                onChange={(e) => setLocalApiKey(e.target.value)}
                placeholder={`Enter your ${PROVIDER_CONFIG[selectedProvider].name} API Key`}
                className="block w-full pl-10 pr-10 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900 dark:text-white"
                aria-label={`${PROVIDER_CONFIG[selectedProvider].name} API Key Input`}
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                aria-label={showKey ? 'Hide API Key' : 'Show API Key'}
              >
                {showKey ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
              </button>
            </div>
            {!isKeySaved && localApiKey && (
                 <button onClick={handleSaveKey} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 font-medium">
                    Save
                </button>
            )}
            {apiKey && (
                 <button onClick={handleClearKey} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 font-medium">
                    Clear
                </button>
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Note: Direct browser API calls may be blocked by your browser's security policy (CORS). If you get a "Failed to fetch" error, try the Ollama (Local) provider.
          </p>
        </div>
      )}
    </div>
  );
};

export default ApiProviderManager;
