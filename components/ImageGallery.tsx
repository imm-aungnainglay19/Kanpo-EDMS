
import React, { useRef, useState } from 'react';
import { SortAscIcon, CheckIcon, SparklesIcon } from './icons';
import { VerificationStatus } from '../types';

interface ImageGalleryProps {
  imageUrls: string[];
  imageNames: string[];
  imageStatuses?: VerificationStatus[];
  selectedIndex: number | null;
  onImageSelect: (index: number) => void;
  onReorder: (dragIndex: number, dropIndex: number) => void;
  onSortByName: () => void;
  showSortButton: boolean;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ imageUrls, imageNames, imageStatuses, selectedIndex, onImageSelect, onReorder, onSortByName, showSortButton }) => {
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const [dragging, setDragging] = useState(false);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    dragItem.current = index;
    setDragging(true);
    e.dataTransfer.effectAllowed = 'move';
  };
  
  const handleDragEnter = (index: number) => {
    dragOverItem.current = index;
  };
  
  const handleDragEnd = () => {
    if (dragItem.current !== null && dragOverItem.current !== null && dragItem.current !== dragOverItem.current) {
        onReorder(dragItem.current, dragOverItem.current);
    }
    dragItem.current = null;
    dragOverItem.current = null;
    setDragging(false);
  };

  const getThumbnailStyle = (index: number): React.CSSProperties => {
    if (dragItem.current === index && dragging) {
      return { opacity: 0.4, transform: 'scale(0.95)' };
    }
    return {};
  };

  return (
    <div className="w-full flex flex-col">
       {/* Optional Header if needed for standalone usage, otherwise handled by parent */}
       {(showSortButton || imageUrls.length === 0) && (
           <div className="flex justify-between items-center mb-2 px-1">
              {imageUrls.length === 0 && <p className="text-sm text-gray-500 italic">No images on this page.</p>}
              {showSortButton && (
                  <button onClick={onSortByName} className="flex items-center text-xs font-medium px-2 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded border border-gray-300 dark:border-gray-500">
                      <SortAscIcon className="h-3 w-3 mr-1"/>
                      Sort
                  </button>
              )}
            </div>
       )}
       
      <div className="flex space-x-2 overflow-x-auto pb-1 items-center px-1 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
        {imageUrls.map((url, index) => {
          const status = imageStatuses?.[index];
          let borderColorClass = 'border-gray-300 dark:border-gray-600 hover:border-indigo-400';
          let statusIcon = null;

          if (status === 'verified') {
              borderColorClass = 'border-green-500 ring-1 ring-green-500';
              statusIcon = <div className="absolute top-0.5 right-0.5 bg-green-500 rounded-full p-0.5 shadow-sm z-10"><CheckIcon className="h-3 w-3 text-white" /></div>;
          } else if (status === 'ai-filled') {
              borderColorClass = 'border-purple-500 ring-1 ring-purple-500';
              statusIcon = <div className="absolute top-0.5 right-0.5 bg-purple-500 rounded-full p-0.5 shadow-sm z-10"><SparklesIcon className="h-3 w-3 text-white" /></div>;
          }

          return (
            <div
                key={`${url}-${index}`}
                className="relative flex-shrink-0 group"
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragEnter={() => handleDragEnter(index)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => e.preventDefault()}
                style={getThumbnailStyle(index)}
            >
                {statusIcon}
                <button
                onClick={() => onImageSelect(index)}
                title={imageNames[index]}
                className={`w-16 h-16 rounded-md overflow-hidden border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                    selectedIndex === index 
                    ? 'border-indigo-600 ring-2 ring-indigo-300 dark:ring-indigo-700 z-10 scale-105' 
                    : borderColorClass
                } ${dragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                aria-label={`Select image ${imageNames[index]}`}
                >
                <img src={url} alt={`Thumbnail of ${imageNames[index]}`} className="w-full h-full object-cover pointer-events-none" />
                </button>
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-[9px] px-1 py-0.5 truncate opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-b-sm">
                    {imageNames[index]}
                </div>
                {dragging && dragOverItem.current === index && dragItem.current !== index && (
                    <div className={`absolute top-0 h-full w-1 ${dragItem.current! > index ? 'left-[-3px]' : 'right-[-3px]'} bg-indigo-500 rounded-full z-10 pointer-events-none`} />
                )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ImageGallery;
