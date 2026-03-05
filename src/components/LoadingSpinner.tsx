
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
      <div className={cn(wrapperClass, 'bg-background', className)}>
        <div className="flex flex-col items-center gap-8">
          <div className="relative flex items-center justify-center">
            <span
              className="absolute h-40 w-40 rounded-full border border-primary/15 animate-[florarte-ripple_4s_ease-out_infinite]"
              style={{ animationDelay: '150ms' }}
            />
            <span
              className="absolute h-56 w-56 rounded-full border border-primary/10 animate-[florarte-ripple_5.5s_ease-out_infinite]"
              style={{ animationDelay: '600ms' }}
            />
            <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-white shadow-[0_25px_80px_rgba(244,37,106,0.18)]">
              <Isotype
                className="text-primary drop-shadow-[0_8px_25px_rgba(244,37,106,0.35)] animate-[florarte-float_3.4s_ease-in-out_infinite]"
                style={{ width: size, height: size }}
              />
            </div>
          </div>

          <div className="text-center space-y-2">
            <p className="font-headline italic text-xl md:text-2xl text-foreground tracking-wide">
              {LUXURY_MESSAGES[messageIndex]}
            </p>
            <p className="text-[11px] uppercase tracking-[0.45em] text-muted-foreground">
              Florarte Premium Experience
            </p>
          </div>

          <div className="flex items-center gap-2 text-primary">
            {[0, 1, 2].map((index) => (
              <span key={index} className="h-1.5 w-8 overflow-hidden rounded-full bg-primary/10">
                <span
                  className="block h-full w-full origin-left bg-primary/70 animate-[florarte-progress_1.8s_ease-in-out_infinite]"
                  style={{ animationDelay: `${index * 250}ms` }}
                />
              </span>
            ))}
          </div>
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
