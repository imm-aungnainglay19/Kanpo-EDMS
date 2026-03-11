
import React from 'react';
import { InfoIcon, UploadIcon, SparklesIcon, PackageIcon, LogOutIcon } from './icons';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FeatureItem: React.FC<{ icon: React.FC<{className?: string}>, title: string, children: React.ReactNode }> = ({ icon: Icon, title, children }) => (
    <div className="flex items-start space-x-4">
        <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-indigo-100 dark:bg-indigo-900/50 rounded-lg">
            <Icon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h4>
            <p className="mt-1 text-gray-600 dark:text-gray-300">{children}</p>
        </div>
    </div>
);


const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <header className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <InfoIcon className="h-6 w-6 text-gray-700 dark:text-gray-300" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">About & Help</h2>
          </div>
        </header>
        <main className="p-6 overflow-y-auto space-y-6">
          <p className="text-gray-700 dark:text-gray-200">
            This application is designed for efficient manual and AI-assisted data extraction from Japanese Official Gazette (Kanpo) images.
          </p>
          
          <div className="space-y-6">
            <FeatureItem icon={UploadIcon} title="Import Images">
                Add images individually or import a full session via a <strong>.zip</strong> or <strong>.json</strong> package. All your work is automatically saved in your browser.
            </FeatureItem>
            <FeatureItem icon={SparklesIcon} title="Auto-fill with AI">
                Use the "Auto-fill with AI" button to automatically extract data from the selected image. You can configure the AI provider, model, and system instructions in the <strong>Settings</strong> menu.
            </FeatureItem>
            <FeatureItem icon={PackageIcon} title="Export Your Work">
                Export your data in various formats (CSV, XLSX) or save your entire session as a <strong>.zip</strong> package (images + data + schema) for backup or transfer.
            </FeatureItem>
             <FeatureItem icon={LogOutIcon} title="Important: Logout & Data">
                Logging out will clear all your session data from this browser for security. Always use the <strong>"Export & Logout"</strong> option to save your work before you leave.
            </FeatureItem>
          </div>

          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-yellow-400 dark:border-yellow-600 rounded-r-lg">
            <h4 className="font-bold text-yellow-800 dark:text-yellow-300">A Note on Security</h4>
            <p className="text-sm text-yellow-700 dark:text-yellow-200 mt-1">
              Your API keys are stored directly in your browser's local storage and are only used to communicate with the AI services from your machine. They are never sent to any other server.
            </p>
          </div>

        </main>
        <footer className="p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <button onClick={onClose} className="px-6 py-2 rounded-md text-gray-700 bg-white dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600">Close</button>
        </footer>
      </div>
    </div>
  );
};

export default AboutModal;
