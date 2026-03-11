
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, ZoomInIcon, ZoomOutIcon, FitToScreenIcon } from './icons';

interface MainImageViewerProps {
  imageUrl: string | null;
  imageName?: string;
  imageCount: number;
  selectedIndex: number | null;
  onNavigate: (direction: 'prev' | 'next') => void;
}

const MIN_SCALE = 1;
const MAX_SCALE = 10;
const ZOOM_SPEED_MULTIPLIER = 1.2;

const MainImageViewer: React.FC<MainImageViewerProps> = ({ imageUrl, imageName, imageCount, selectedIndex, onNavigate }) => {
  const [scale, setScale] = useState(MIN_SCALE);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [baseImageSize, setBaseImageSize] = useState({ width: 0, height: 0 });
  
  const containerRef = useRef<HTMLDivElement>(null);

  const resetZoom = useCallback(() => {
    setScale(MIN_SCALE);
    setPosition({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    resetZoom();
  }, [imageUrl, resetZoom]);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setBaseImageSize({ width: e.currentTarget.clientWidth, height: e.currentTarget.clientHeight });
  };

  const clampPosition = useCallback((pos: { x: number, y: number }, currentScale: number) => {
    if (!containerRef.current || baseImageSize.width === 0) return pos;

    const { width: containerWidth, height: containerHeight } = containerRef.current.getBoundingClientRect();
    
    const scaledWidth = baseImageSize.width * currentScale;
    const scaledHeight = baseImageSize.height * currentScale;
    
    const overhangX = Math.max(0, scaledWidth - containerWidth);
    const overhangY = Math.max(0, scaledHeight - containerHeight);
    
    const maxX = overhangX / 2;
    const minX = -maxX;
    const maxY = overhangY / 2;
    const minY = -maxY;

    return {
      x: Math.max(minX, Math.min(maxX, pos.x)),
      y: Math.max(minY, Math.min(maxY, pos.y)),
    };
  }, [baseImageSize]);

  const handleZoom = useCallback((direction: 'in' | 'out', center?: {x: number, y: number}) => {
    const newScale = direction === 'in' ? scale * ZOOM_SPEED_MULTIPLIER : scale / ZOOM_SPEED_MULTIPLIER;
    const clampedScale = Math.max(MIN_SCALE, Math.min(newScale, MAX_SCALE));

    if (clampedScale === scale) return;

    if (clampedScale <= MIN_SCALE) {
        resetZoom();
        return;
    }
    
    let newPos = position;
    if (center && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const mouseX = center.x - rect.left;
        const mouseY = center.y - rect.top;

        const imageX = (mouseX - position.x) / scale;
        const imageY = (mouseY - position.y) / scale;

        newPos = {
            x: mouseX - imageX * clampedScale,
            y: mouseY - imageY * clampedScale,
        };
    }
    
    setScale(clampedScale);
    setPosition(clampPosition(newPos, clampedScale));
  }, [scale, position, clampPosition, resetZoom]);
  
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    handleZoom(e.deltaY < 0 ? 'in' : 'out', {x: e.clientX, y: e.clientY});
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= MIN_SCALE) return;
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const newPos = { x: e.clientX - dragStart.x, y: e.clientY - dragStart.y };
    setPosition(clampPosition(newPos, scale));
  };
  
  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  if (!imageUrl || selectedIndex === null) {
    return (
      <div className="relative w-full h-full bg-white dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">No image selected.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="relative w-full flex-1 min-h-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg flex items-center justify-center shadow-md overflow-hidden" 
           ref={containerRef}
           onWheel={handleWheel}
           onMouseDown={handleMouseDown}
           onMouseMove={handleMouseMove}
           onMouseUp={handleMouseUpOrLeave}
           onMouseLeave={handleMouseUpOrLeave}
      >
        <img 
          src={imageUrl} 
          alt={imageName || `Kanpo document ${selectedIndex + 1}`} 
          className="object-contain h-full w-full p-2 rounded-lg max-w-full max-h-full"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            cursor: scale > MIN_SCALE ? (isDragging ? 'grabbing' : 'grab') : 'default',
            transition: isDragging ? 'none' : 'transform 0.1s ease-out',
          }}
          onLoad={handleImageLoad}
          onDragStart={(e) => e.preventDefault()}
        />
        
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          {imageCount > 1 && (
            <>
              <button
                onMouseDown={e => e.stopPropagation()}
                onClick={() => onNavigate('prev')}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-75 transition-opacity z-10 pointer-events-auto"
                aria-label="Previous image"
              >
                <ChevronLeftIcon className="h-6 w-6" />
              </button>
              <button
                onMouseDown={e => e.stopPropagation()}
                onClick={() => onNavigate('next')}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-75 transition-opacity z-10 pointer-events-auto"
                aria-label="Next image"
              >
                <ChevronRightIcon className="h-6 w-6" />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex justify-between items-center mt-3 px-1 shrink-0">
        <div className="flex-1 min-w-0 mr-4">
          {imageName && (
             <div className="inline-flex items-center px-3 py-1.5 rounded-md bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 shadow-sm">
                <p className="text-base font-bold text-blue-800 dark:text-blue-200 font-mono truncate select-all" title={imageName}>
                  {imageName}
                </p>
             </div>
          )}
        </div>
        
        <div className="flex-shrink-0 mx-4">
            <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 shadow-sm text-gray-800 dark:text-gray-200 px-2 py-1 rounded-full flex items-center space-x-2">
              <button onClick={() => handleZoom('out')} disabled={scale <= MIN_SCALE} className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed" aria-label="Zoom out">
                  <ZoomOutIcon className="h-5 w-5"/>
              </button>
              <button onClick={resetZoom} className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600" aria-label="Reset zoom">
                  <FitToScreenIcon className="h-5 w-5"/>
              </button>
              <button onClick={() => handleZoom('in')} disabled={scale >= MAX_SCALE} className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed" aria-label="Zoom in">
                  <ZoomInIcon className="h-5 w-5"/>
              </button>
              <span className="w-12 text-center text-sm font-semibold tabular-nums">{(scale * 100).toFixed(0)}%</span>
            </div>
        </div>

        <div className="flex-1 min-w-0 text-right">
            <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                {selectedIndex + 1} / {imageCount}
            </p>
        </div>
      </div>
    </div>
  );
};

export default MainImageViewer;
