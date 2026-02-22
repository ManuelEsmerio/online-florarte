
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Sparkles, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

export const CookieConsentBanner = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Si ya existe una decisión guardada, no lo mostramos
    const consent = localStorage.getItem('cookie_consent');
    if (consent === null) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie_consent', 'accepted');
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-[100] p-4 md:p-8 transition-all duration-700 ease-in-out transform",
        isVisible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
      )}
    >
      <Card className="max-w-5xl mx-auto border-none bg-[#121212] shadow-[0_20px_50px_rgba(0,0,0,0.4)] rounded-[1.5rem] md:rounded-full overflow-hidden border border-white/5">
        <CardContent className="p-4 md:p-3 md:pl-6 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-8">
            <div className="flex items-center gap-4 text-left">
                 <div className="hidden sm:flex w-10 h-10 rounded-full bg-primary/10 items-center justify-center text-primary shrink-0">
                    <Sparkles className="h-5 w-5 fill-primary/20" />
                 </div>
                 <p className="text-xs md:text-sm text-white/90 leading-relaxed font-medium">
                    Utilizamos cookies para que tu experiencia florezca. Al continuar, aceptas nuestra <Link href="/cookies-policy" className="text-primary hover:underline font-bold transition-colors">política de cookies</Link>.
                 </p>
            </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
            <Button 
                asChild
                variant="outline" 
                className="flex-1 md:flex-none h-10 px-6 rounded-full border-white/20 bg-transparent text-primary hover:bg-white/5 hover:text-primary transition-all text-xs font-bold"
            >
                <Link href="/cookies-policy">
                    Configurar
                </Link>
            </Button>
            
            <Button 
                onClick={handleAccept} 
                className="flex-1 md:flex-none h-10 px-8 rounded-full font-bold shadow-[0_0_20px_rgba(255,45,120,0.3)] bg-primary hover:bg-primary/90 text-white transition-all active:scale-95 text-xs"
            >
                Aceptar Todo
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
