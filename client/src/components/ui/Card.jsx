import React from 'react';
import { cn } from './Button'; // reuse cn utility

export const Card = React.forwardRef(({ className, children, decoration = 'circle', decorationColor = 'bg-primary-yellow', ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn('bauhaus-card', className)}
      {...props}
    >
      {/* Corner Decoration */}
      {decoration === 'circle' && (
        <div className={`absolute top-2 right-2 w-3 h-3 rounded-full ${decorationColor} border-2 border-black`} />
      )}
      {decoration === 'square' && (
        <div className={`absolute top-2 right-2 w-3 h-3 rounded-none ${decorationColor} border-2 border-black`} />
      )}
      {decoration === 'triangle' && (
        <div className={`absolute top-2 right-2 w-3 h-3 ${decorationColor}`} style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }} />
      )}
      
      {children}
    </div>
  );
});
Card.displayName = 'Card';
