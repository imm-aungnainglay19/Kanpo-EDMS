
import React, { useState, useEffect } from 'react';
import { ChevronDownIcon } from './icons';

interface SystemPromptManagerProps {
  currentPrompt: string;
  onSavePrompt: (prompt: string) => void;
  defaultPrompt: string;
}

const SystemPromptManager: React.FC<SystemPromptManagerProps> = ({ currentPrompt, onSavePrompt, defaultPrompt }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [editedPrompt, setEditedPrompt] = useState(currentPrompt);
  const [isSaved, setIsSaved] = useState(true);

  useEffect(() => {
    setEditedPrompt(currentPrompt);
    setIsSaved(true);
  }, [currentPrompt]);

  const handleSave = () => {
    onSavePrompt(editedPrompt);
    setIsSaved(true);
  };
  
  const handleReset = () => {
    setEditedPrompt(defaultPrompt);
    onSavePrompt(defaultPrompt);
    setIsSaved(true);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditedPrompt(e.target.value);
    setIsSaved(false);
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      <button
        className="w-full flex justify-between items-center p-4 text-left focus:outline-none"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls="system-prompt-content"
      >
        <div className="flex flex-col">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">AI System Instructions</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Click to view and edit the instructions guiding the AI.</p>
        </div>
        <ChevronDownIcon className={`h-6 w-6 text-gray-500 transform transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div id="system-prompt-content" className="p-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                This is the core prompt given to the AI to extract information. You can modify it to improve accuracy for specific cases. Your changes will be saved in your browser.
            </p>
            <textarea
                value={editedPrompt}
                onChange={handleTextChange}
                className="block w-full h-64 p-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm font-mono text-gray-900 dark:text-gray-200"
                aria-label="AI System Prompt Editor"
            />
            <div className="mt-4 flex items-center justify-end space-x-3">
                <button 
                    onClick={handleReset}
                    title="Regenerate instructions based on your current form fields"
                    className="px-4 py-2 bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 font-medium"
                >
                    Regenerate from Schema
                </button>
                <button 
                    onClick={handleSave}
                    disabled={isSaved}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 font-medium disabled:bg-indigo-400 dark:disabled:bg-indigo-800 disabled:cursor-not-allowed"
                >
                    {isSaved ? 'Saved' : 'Save Changes'}
                </button>
            </div>
        </div>
      )}
    </div>
  );
};

export default SystemPromptManager;
