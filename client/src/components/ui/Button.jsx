import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const variants = {
  primary: 'bg-primary-red text-white',
  secondary: 'bg-primary-blue text-white',
  yellow: 'bg-primary-yellow text-black',
  outline: 'bg-white text-black',
  ghost: 'border-none text-black hover:bg-gray-200 shadow-none active:translate-x-0 active:translate-y-0',
};

const shapes = {
  square: 'rounded-none',
  pill: 'rounded-full',
};

export const Button = React.forwardRef(({ 
  className, 
  variant = 'primary', 
  shape = 'square',
  children, 
  ...props 
}, ref) => {
  return (
    <button
      ref={ref}
      className={cn(
        'bauhaus-button px-6 py-3',
        variants[variant],
        shapes[shape],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
});
Button.displayName = 'Button';
