
import React, { useState, useEffect, useRef } from 'react';
import { DownloadIcon, ChevronDownIcon } from './icons';

interface ExportButtonProps {
  disabled: boolean;
  onExportCSV: () => void;
  onExportXLSX: () => void;
  onExportSession: () => void;
  onExportPackage: () => void;
}

const ExportButton: React.FC<ExportButtonProps> = ({ disabled, onExportCSV, onExportXLSX, onExportSession, onExportPackage }) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [wrapperRef]);
  
  const handleExport = (exportFn: () => void) => {
    exportFn();
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className="w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-green-400 dark:disabled:bg-green-800 disabled:cursor-not-allowed transition-colors"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <DownloadIcon className="h-5 w-5 mr-2" />
        Export Data
        <ChevronDownIcon className="h-5 w-5 ml-2 -mr-1" />
      </button>
      
      {isOpen && (
        <div
          className="origin-top-right absolute right-0 bottom-full mb-2 w-56 rounded-md shadow-lg bg-white dark:bg-gray-700 ring-1 ring-black ring-opacity-5 focus:outline-none z-20"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="menu-button"
        >
          <div className="py-1" role="none">
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); handleExport(onExportPackage); }}
              className="font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 block px-4 py-2 text-sm"
              role="menuitem"
            >
              Export Package (.zip)
            </a>
            <div className="border-t border-gray-200 dark:border-gray-600 my-1"></div>
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); handleExport(onExportXLSX); }}
              className="text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 block px-4 py-2 text-sm"
              role="menuitem"
            >
              Export as Excel (.xlsx)
            </a>
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); handleExport(onExportCSV); }}
              className="text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 block px-4 py-2 text-sm"
              role="menuitem"
            >
              Export as CSV
            </a>
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); handleExport(onExportSession); }}
              className="text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 block px-4 py-2 text-sm"
              role="menuitem"
            >
              Export Session (.json)
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExportButton;