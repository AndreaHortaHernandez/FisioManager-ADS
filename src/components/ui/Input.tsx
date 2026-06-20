import React from 'react';
import { cn } from '../../utils/cn';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;
    
    return (
      <div className="flex flex-col gap-1 w-full">
        {label && (
          <label htmlFor={inputId} className="text-sm font-body text-on-surface-variant ml-2 tracking-wide">
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={cn(
            'bg-surface-container text-on-surface rounded-t-lg px-4 py-3 border-b-2 border-transparent transition-all outline-none',
            'focus:bg-surface-container-lowest focus:border-b-primary focus:border-ghost',
            className
          )}
          {...props}
        />
      </div>
    );
  }
);

Input.displayName = 'Input';
