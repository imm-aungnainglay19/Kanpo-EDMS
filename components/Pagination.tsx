
import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from './icons';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const DoubleChevronLeftIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m11 17-5-5 5-5"/><path d="m18 17-5-5 5-5"/>
    </svg>
);

const DoubleChevronRightIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m6 17 5-5-5-5"/><path d="m13 17 5-5-5-5"/>
    </svg>
);

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
  const canGoBack = currentPage > 1;
  const canGoForward = currentPage < totalPages;

  const buttonClass = "p-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors";

  return (
    <div className="flex items-center justify-center space-x-3 py-2">
      <button
        onClick={() => onPageChange(1)}
        disabled={!canGoBack}
        className={buttonClass}
        aria-label="Go to first page"
      >
        <DoubleChevronLeftIcon className="h-5 w-5" />
      </button>
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={!canGoBack}
        className={buttonClass}
        aria-label="Go to previous page"
      >
        <ChevronLeftIcon className="h-5 w-5" />
      </button>

      <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
        Page {currentPage} of {totalPages}
      </span>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={!canGoForward}
        className={buttonClass}
        aria-label="Go to next page"
      >
        <ChevronRightIcon className="h-5 w-5" />
      </button>
      <button
        onClick={() => onPageChange(totalPages)}
        disabled={!canGoForward}
        className={buttonClass}
        aria-label="Go to last page"
      >
        <DoubleChevronRightIcon className="h-5 w-5" />
      </button>
    </div>
  );
};

export default Pagination;
