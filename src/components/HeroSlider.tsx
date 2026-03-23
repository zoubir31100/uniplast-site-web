
import React from 'react';

interface HeroSliderProps {
  imageSrc: string | null;
  title?: string;
  isSticky?: boolean;
  verticalPosition?: number; // 0 to 100 (percentage)
}

export const HeroSlider: React.FC<HeroSliderProps> = ({ 
  imageSrc, 
  title, 
  isSticky = false,
  verticalPosition = 50 // Default center
}) => {
  // If no image is provided, don't render anything
  if (!imageSrc) {
    return null; 
  }

  return (
    <div 
      className={`relative w-full mb-8 group rounded-b-xl overflow-hidden shadow-md border-b border-x border-gray-200 dark:border-gray-700 transition-all duration-300 bg-white dark:bg-gray-900 ${
        isSticky 
          ? 'sticky top-[72px] md:top-[80px] z-30 shadow-xl' // Increased z-index (z-30) to stay above products (z-0/z-10), below header (z-40)
          : 'z-0'
      }`}
    >
      {/* 
        Responsive Aspect Ratio:
        Mobile: Higher relative height (aspect-video or custom h-48) to show details.
        Desktop: Wide banner format (h-64 or h-80).
      */}
      <div className="w-full h-48 sm:h-64 md:h-80 relative bg-gray-100 dark:bg-gray-800">
        <img 
          src={imageSrc} 
          alt={title || "Banner"} 
          className="w-full h-full object-cover transition-all duration-300 ease-out"
          style={{ objectPosition: `50% ${verticalPosition}%` }} // Dynamic vertical alignment
        />
        
        {/* Optional Title Overlay */}
        {title && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 pt-12">
             <h2 className="text-white text-2xl md:text-4xl font-bold drop-shadow-md">{title === 'ALL' ? 'الرئيسية' : title}</h2>
          </div>
        )}
      </div>
    </div>
  );
};
