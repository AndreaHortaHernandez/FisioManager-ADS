import React from 'react';
import { cn } from '../../utils/cn';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  level?: 1 | 2 | 3;
}

export function Card({ children, className, level = 1, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl p-6 transition-colors duration-300',
        level === 1 && 'bg-surface-container-lowest', 
        level === 2 && 'bg-surface-container-low',
        level === 3 && 'bg-surface-container',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
