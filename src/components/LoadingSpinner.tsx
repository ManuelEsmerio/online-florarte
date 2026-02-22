
'use client';

import { Isotype } from './icons/Isotype';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: number;
  className?: string;
}

export const LoadingSpinner = ({ size = 48, className }: LoadingSpinnerProps) => {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-4", className)}>
      <div className="relative">
        <Isotype 
          className="animate-spin duration-[3000ms] text-primary" 
          style={{ width: size, height: size }} 
        />
        <div className="absolute inset-0 animate-ping opacity-20 bg-primary rounded-full" />
      </div>
      <p className="text-muted-foreground animate-pulse text-sm font-medium tracking-wider">Cargando...</p>
    </div>
  );
};
