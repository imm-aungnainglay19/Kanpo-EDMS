
import React, { useState, useEffect } from 'react';
import { KanpoData } from '../types';
import { ChevronUpIcon, ChevronDownIcon, CheckIcon } from './icons';

interface BulkPasteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (startIndex: number, mapping: { dataIndex: number, imageIndex: number }[]) => void;
  jsonData: KanpoData[];
  startIndex: number;
  totalImages: number;
  getImageName: (index: number) => Promise<string>;
}

const BulkPasteModal: React.FC<BulkPasteModalProps> = ({ 
    isOpen, onClose, onConfirm, jsonData, startIndex: initialStartIndex, totalImages, getImageName 
}) => {
  const [startIndex, setStartIndex] = useState(initialStartIndex);
  const [previewItems, setPreviewItems] = useState<{dataIndex: number, imageIndex: number, imageName: string, dataName: string}[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
      const loadPreview = async () => {
          setIsLoading(true);
          const items = [];
          for (let i = 0; i < jsonData.length; i++) {
              const imageIdx = startIndex + i;
              if (imageIdx < totalImages) {
                  const name = await getImageName(imageIdx);
                  const dataRecord = jsonData[i];
                  // Try to find a name in the data record for comparison
                  const dataName = dataRecord['漢字商号/氏名'] || dataRecord['5. 漢字商号/氏名'] || dataRecord['データID'] || 'No Name';
                  
                  items.push({
                      dataIndex: i,
                      imageIndex: imageIdx,
                      imageName: name,
                      dataName: String(dataName)
                  });
              }
          }
          setPreviewItems(items);
          setIsLoading(false);
      };
      
      if (isOpen) {
          loadPreview();
      }
  }, [isOpen, startIndex, jsonData, totalImages, getImageName]);

  if (!isOpen) return null;

  const handleConfirm = () => {
      const mapping = previewItems.map(item => ({
          dataIndex: item.dataIndex,
          imageIndex: item.imageIndex
      }));
      onConfirm(startIndex, mapping);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl m-4 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Review Bulk Import</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Align the pasted data with your images. Use the controls to shift the starting image.
            </p>
        </div>

        <div className="p-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <div className="flex items-center space-x-4">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Start at Image Index:</label>
                <div className="flex items-center bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md">
                    <button 
                        onClick={() => setStartIndex(Math.max(0, startIndex - 1))}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 border-r border-gray-300 dark:border-gray-600"
                        disabled={startIndex === 0}
                    >
                        <ChevronDownIcon className="h-4 w-4 text-gray-600 dark:text-gray-400"/>
                    </button>
                    <span className="w-16 text-center font-mono text-gray-900 dark:text-white">{startIndex + 1}</span>
                    <button 
                        onClick={() => setStartIndex(Math.min(totalImages - 1, startIndex + 1))}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 border-l border-gray-300 dark:border-gray-600"
                        disabled={startIndex >= totalImages - 1}
                    >
                        <ChevronUpIcon className="h-4 w-4 text-gray-600 dark:text-gray-400"/>
                    </button>
                </div>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
                Applying {jsonData.length} records
            </div>
        </div>

        <div className="flex-1 overflow-auto p-0">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Target Image (System)</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Pasted Data (Preview)</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                    </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {isLoading ? (
                        <tr>
                            <td colSpan={3} className="px-6 py-4 text-center text-gray-500">Loading preview...</td>
                        </tr>
                    ) : (
                        previewItems.map((item, idx) => (
                            <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                    <div className="flex flex-col">
                                        <span>Image {item.imageIndex + 1}</span>
                                        <span className="text-xs text-gray-500 font-mono">{item.imageName}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                    <div className="flex flex-col">
                                        <span className="font-bold">{item.dataName}</span>
                                        <span className="text-xs text-gray-500">Record #{item.dataIndex + 1}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                        Match
                                    </span>
                                </td>
                            </tr>
                        ))
                    )}
                    {jsonData.length > previewItems.length && !isLoading && (
                        <tr>
                            <td colSpan={3} className="px-6 py-4 text-center text-red-500 text-sm">
                                Warning: {jsonData.length - previewItems.length} records will be ignored (not enough images).
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex justify-end space-x-3 rounded-b-lg">
            <button 
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
                Cancel
            </button>
            <button 
                onClick={handleConfirm}
                disabled={previewItems.length === 0}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Confirm Import
            </button>
        </div>

      </div>
    </div>
  );
};

export default BulkPasteModal;
