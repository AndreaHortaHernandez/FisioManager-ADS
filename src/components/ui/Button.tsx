import React from 'react';
import { cn } from '../../utils/cn';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'tertiary';
  fullWidth?: boolean;
}

export function Button({ 
  children, 
  variant = 'primary', 
  fullWidth,
  className, 
  ...props 
}: ButtonProps) {
  return (
    <button
      className={cn(
        'px-6 py-3 rounded-full font-bold transition-all duration-300 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed',
        variant === 'primary' && 'btn-gradient text-white shadow-ambient',
        variant === 'secondary' && 'bg-secondary-container text-on-secondary-container',
        variant === 'tertiary' && 'bg-transparent text-primary hover:bg-surface-variant',
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
