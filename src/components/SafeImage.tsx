import React, {useState} from 'react';
import {Sprout} from 'lucide-react';

interface SafeImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  fallbackTitle?: string;
}

export const SafeImage: React.FC<SafeImageProps> = ({src, alt, className = '', fallbackTitle}) => {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#DDEFE0] to-[#F3F8F0] text-[#183B2B] p-4 text-center ${className}`}
      >
        <Sprout className="w-8 h-8 text-[#16803C] mb-1.5" aria-hidden="true" />
        {fallbackTitle && <span className="text-xs font-medium text-[#183B2B]/80">{fallbackTitle}</span>}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
};
