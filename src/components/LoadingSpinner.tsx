
'use client';

import { useEffect, useMemo, useState } from 'react';
import { Isotype } from './icons/Isotype';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: number;
  className?: string;
  variant?: 'default' | 'luxury';
  fullScreen?: boolean;
}

const LUXURY_MESSAGES = [
  'Preparando tu experiencia...',
  'Cuidando cada detalle...',
  'Casi listo...',
  'Seleccionando lo mejor para ti...',
  'Asegurando la excelencia...',
];

export const LoadingSpinner = ({
  size = 48,
  className,
  variant = 'default',
  fullScreen = false,
}: LoadingSpinnerProps) => {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    if (variant !== 'luxury') return;
    const timer = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % LUXURY_MESSAGES.length);
    }, 2800);

    return () => clearInterval(timer);
  }, [variant]);

  const wrapperClass = useMemo(() => {
    if (!fullScreen) return 'flex flex-col items-center justify-center';
    return 'fixed inset-0 z-[120] flex flex-col items-center justify-center overflow-hidden bg-background';
  }, [fullScreen]);

  if (variant === 'luxury') {
    return (
      <div className={cn(wrapperClass, className)}>
        <div className="pointer-events-none absolute inset-0 opacity-30 dark:opacity-20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.14),transparent_60%)] transition-opacity duration-700" />
          <div className="absolute right-[8%] bottom-[12%] h-80 w-80 rounded-full bg-primary/15 blur-3xl animate-pulse" style={{ animationDelay: '900ms' }} />
          <div className="absolute left-[68%] top-[48%] h-48 w-48 rounded-full bg-primary/20 blur-2xl animate-pulse" style={{ animationDelay: '1600ms' }} />
          <div className="absolute left-[6%] bottom-[35%] h-72 w-72 rounded-full bg-primary/10 blur-3xl animate-pulse" style={{ animationDelay: '2300ms' }} />
        </div>

        <div className="relative z-10 flex flex-col items-center">
          <div className="relative flex items-center justify-center">
            <div className="absolute h-28 w-28 rounded-full border border-primary/25 animate-[spin_8s_linear_infinite]" style={{ animationDuration: '8s' }} />
            <div className="absolute h-24 w-24 rounded-full bg-primary/20 blur-2xl animate-pulse" />
            <Isotype
              className="relative text-primary drop-shadow-[0_0_14px_rgba(244,37,106,0.55)] animate-[spin_8s_linear_infinite]"
              style={{ width: size, height: size }}
            />
          </div>

          <div className="mt-10 h-8 flex items-center justify-center transition-all duration-500">
            <p className="font-headline italic tracking-wide text-lg md:text-2xl text-foreground animate-pulse">
              {LUXURY_MESSAGES[messageIndex]}
            </p>
          </div>

          <p className="mt-1 text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
            Florarte Premium Experience
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col items-center justify-center gap-4", className)}>
      <div className="relative">
        <Isotype
          className="animate-[spin_6s_ease-in-out_infinite] text-primary"
          style={{ width: size, height: size }}
        />
        <div className="absolute inset-0 animate-ping opacity-20 bg-primary rounded-full [animation-duration:6s]" />
      </div>
      <p className="text-muted-foreground animate-pulse text-sm font-medium tracking-wider">Cargando...</p>
    </div>
  );
};
