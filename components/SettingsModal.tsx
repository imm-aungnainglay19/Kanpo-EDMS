
import React, { useState, useRef, useEffect } from 'react';
import { FormSchema, ApiConfig } from '../types';
import { SettingsIcon, ScrollTextIcon, EditIcon, DownloadIcon, ImportIcon } from './icons';
import ApiProviderManager, { PROVIDER_CONFIG } from './ApiKeyManager';
import SystemPromptManager from './SystemPromptManager';
import { generateSystemPrompt } from '../services/aiService';
import { BASE_SYSTEM_INSTRUCTION } from '../services/prompts';
import { DEFAULT_FORM_SCHEMA } from '../services/schema';
import FormSchemaEditor from './FormSchemaEditor';
import ConfirmationModal from './ConfirmationModal';


interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSchema: FormSchema;
  onSave: (newSchema: FormSchema) => void;
  apiConfig: ApiConfig;
  onApiConfigChange: (config: ApiConfig) => void;
  systemPrompt: string;
  onSystemPromptChange: (prompt: string) => void;
}

type Tab = 'ai' | 'prompt' | 'form';

const SettingsModal: React.FC<SettingsModalProps> = ({ 
    isOpen, onClose, currentSchema, onSave,
    apiConfig, onApiConfigChange, systemPrompt, onSystemPromptChange
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('form');
  const [schema, setSchema] = useState<FormSchema>(JSON.parse(JSON.stringify(currentSchema)));
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSchema(JSON.parse(JSON.stringify(currentSchema)));
  }, [currentSchema, isOpen]);

  if (!isOpen) return null;

  const handleSaveSchema = () => {
    onSave(schema);
  };
  
  const handleConfirmReset = () => {
    const newSchema = JSON.parse(JSON.stringify(DEFAULT_FORM_SCHEMA));
    setSchema(newSchema);
    onSave(newSchema);
    setIsResetConfirmOpen(false);
  };

  const handleExportSchema = () => {
    const jsonString = JSON.stringify(schema, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'form_schema.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleTriggerImport = () => {
    importInputRef.current?.click();
  };

  const handleImportSchema = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const importedSchema = JSON.parse(text);
        setSchema(importedSchema);
        alert('Schema imported successfully. Review the changes and click "Save Form Changes" to apply.');
      } catch (error) {
        alert('Failed to import schema. Please check if the file is a valid JSON format.');
        console.error(error);
      }
    };
    reader.readAsText(file);
    if(event.target) event.target.value = '';
  };

  // Generate the default prompt based on the CURRENT active schema, not the hardcoded default.
  // This ensures that if the user has imported the "Customer Excel Format", the AI prompt matches it.
  const defaultPrompt = generateSystemPrompt(currentSchema, BASE_SYSTEM_INSTRUCTION);
  
  const TABS: { id: Tab; name: string; icon: React.FC<{className?: string}> }[] = [
      { id: 'form', name: 'Form Structure Editor', icon: EditIcon },
      { id: 'ai', name: 'AI Configuration', icon: SettingsIcon },
      { id: 'prompt', name: 'AI System Instructions', icon: ScrollTextIcon },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center" onClick={onClose}>
      <ConfirmationModal
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={handleConfirmReset}
        title="Confirm Reset Form"
      >
        Are you sure you want to reset the form to its default structure? All your customizations will be lost.
      </ConfirmationModal>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <header className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h2>
        </header>
        <nav className="border-b border-gray-200 dark:border-gray-700">
            <div className="px-6 flex space-x-8">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center space-x-2 py-4 px-1 border-b-2 text-sm font-medium focus:outline-none ${
                            activeTab === tab.id
                            ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600'
                        }`}
                    >
                        <tab.icon className="h-5 w-5" />
                        <span>{tab.name}</span>
                    </button>
                ))}
            </div>
        </nav>
        <main className="p-6 overflow-y-auto flex-1">
            {activeTab === 'ai' && (
                <ApiProviderManager
                    selectedProvider={apiConfig.provider}
                    onProviderChange={(provider) => {
                        const newConfig = PROVIDER_CONFIG[provider];
                        const defaultModel = newConfig.models.length > 0 ? newConfig.models[0] : '';
                        onApiConfigChange({ 
                            ...apiConfig, 
                            provider, 
                            model: defaultModel 
                        });
                    }}
                    apiKey={apiConfig.apiKey}
                    onApiKeyChange={(key) => onApiConfigChange({ ...apiConfig, apiKey: key })}
                    selectedModel={apiConfig.model}
                    onModelChange={(model) => onApiConfigChange({ ...apiConfig, model })}
                    ollamaUrl={apiConfig.ollamaUrl}
                    ollamaModel={apiConfig.ollamaModel}
                    onOllamaConfigChange={(url, model) => onApiConfigChange({ ...apiConfig, ollamaUrl: url, ollamaModel: model })}
                />
            )}
            {activeTab === 'prompt' && (
                <SystemPromptManager
                    currentPrompt={systemPrompt}
                    onSavePrompt={onSystemPromptChange}
                    defaultPrompt={defaultPrompt}
                />
            )}
            {activeTab === 'form' && (
                <>
                 <input type="file" ref={importInputRef} onChange={handleImportSchema} className="hidden" accept=".json,application/json" />
                 <FormSchemaEditor
                    schema={schema}
                    setSchema={setSchema}
                 />
                </>
            )}
        </main>
        <footer className="p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <div>
            {activeTab === 'form' && (
              <div className="flex items-center flex-wrap gap-2">
                <button onClick={handleExportSchema} className="flex items-center px-4 py-2 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-md hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-700 dark:hover:bg-green-900/40 transition-colors"><DownloadIcon className="h-4 w-4 mr-2"/>Export Form</button>
                <button onClick={handleTriggerImport} className="flex items-center px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-700 dark:hover:bg-blue-900/40 transition-colors"><ImportIcon className="h-4 w-4 mr-2"/>Import Form</button>
                <button onClick={() => setIsResetConfirmOpen(true)} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors">Reset Form</button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
             {activeTab === 'form' && (
                <button onClick={handleSaveSchema} className="px-6 py-2 rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">Save Form Changes</button>
             )}
            <button onClick={onClose} className="px-6 py-2 rounded-md text-gray-700 bg-white dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600">Close</button>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default SettingsModal;
