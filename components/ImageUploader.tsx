import React from 'react';
import { UploadIcon } from './icons';

interface ImageUploaderProps {
  onImageChange: (files: FileList | null) => void;
  onAreaClick: () => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageChange, onAreaClick }) => {

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      onImageChange(event.dataTransfer.files);
    }
    event.currentTarget.classList.remove('border-indigo-500');
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };
    
  const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.classList.add('border-indigo-500');
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.classList.remove('border-indigo-500');
  };

  return (
    <div 
      className="relative w-full h-96 bg-white dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center transition-all duration-300 ease-in-out cursor-pointer hover:border-indigo-400"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onClick={onAreaClick}
    >
      <div className="text-center text-gray-500 dark:text-gray-400 pointer-events-none">
        <UploadIcon className="mx-auto h-12 w-12" />
        <p className="mt-2 text-sm font-medium">
          <span className="text-indigo-600 dark:text-indigo-400">Upload file(s)</span> or drag and drop
        </p>
        <p className="mt-1 text-xs">PNG, JPG, WEBP</p>
      </div>
    </div>
  );
};

export default ImageUploader;