
'use client'

import { Paintbrush, Monitor, Sun, Moon, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

const themes = [
  { name: 'theme-default', label: 'Sakura', color: 'bg-[#f4256a]' },
  { name: 'theme-lavender', label: 'Lavanda', color: 'bg-[#8B5CF6]' },
  { name: 'theme-mint', label: 'Menta', color: 'bg-[#10B981]' },
  { name: 'theme-peach', label: 'Durazno', color: 'bg-[#FB923C]' },
];

export function ThemeCustomizer() {
  const { theme, setTheme } = useTheme()
  const [currentThemeName, setCurrentThemeName] = useState('theme-default');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('admin-color-theme') || 'theme-default';
    setCurrentThemeName(savedTheme);
    // Apply on mount
    document.body.classList.forEach(className => {
      if (className.startsWith('theme-')) {
        document.body.classList.remove(className);
      }
    });
    document.body.classList.add(savedTheme);
  }, []);

  const handleModeChange = (mode: string) => {
    setTheme(mode);
  }
  
  const handleThemeChange = (newThemeName: string) => {
    document.body.classList.forEach(className => {
      if (className.startsWith('theme-')) {
        document.body.classList.remove(className);
      }
    });
    document.body.classList.add(newThemeName);
    localStorage.setItem('admin-color-theme', newThemeName);
    setCurrentThemeName(newThemeName);
  }

  if (!mounted) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-primary/10 hover:text-primary transition-all active:scale-90 group">
          <Paintbrush className="h-5 w-5 transition-transform group-hover:rotate-12" />
          <span className="sr-only">Personalizar Tema</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-8 rounded-[2.5rem] border-none shadow-2xl bg-background/95 backdrop-blur-xl animate-fade-in" align="end">
        <div className="grid gap-10">
          {/* Section: Mode */}
          <div className="space-y-5">
            <Label className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground ml-1">Modo de Visualización</Label>
            <div className="grid grid-cols-3 gap-2 p-1 bg-muted/30 rounded-2xl">
              {[
                { id: 'light', label: 'Claro', icon: Sun },
                { id: 'dark', label: 'Oscuro', icon: Moon },
                { id: 'system', label: 'Auto', icon: Monitor },
              ].map((mode) => {
                const isActive = theme === mode.id;
                return (
                  <button
                    key={mode.id}
                    onClick={() => handleModeChange(mode.id)}
                    className={cn(
                      "flex items-center justify-center gap-2 h-11 rounded-xl font-bold text-xs transition-all duration-300",
                      isActive 
                        ? "bg-primary text-white shadow-lg shadow-primary/20 scale-100" 
                        : "text-muted-foreground hover:text-primary hover:bg-primary/5 scale-95"
                    )}
                  >
                    <mode.icon className="h-3.5 w-3.5" />
                    <span>{mode.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Section: Brand Color */}
          <div className="space-y-6">
            <Label className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground ml-1">Color de Marca</Label>
            <div className="flex items-center justify-between px-1">
              {themes.map((t) => (
                <div key={t.name} className="flex flex-col items-center gap-3">
                  <button
                    onClick={() => handleThemeChange(t.name)}
                    className={cn(
                      'h-12 w-12 rounded-full transition-all duration-500 flex items-center justify-center relative group',
                      t.color,
                      currentThemeName === t.name 
                        ? 'ring-[3px] ring-offset-4 ring-primary scale-110' 
                        : 'opacity-80 hover:opacity-100 hover:scale-105'
                    )}
                  >
                    {currentThemeName === t.name && (
                        <Check className="h-5 w-5 text-white animate-in zoom-in duration-500" />
                    )}
                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 rounded-full transition-opacity" />
                  </button>
                  <span className={cn(
                      "text-[9px] font-black uppercase tracking-widest transition-colors duration-300",
                      currentThemeName === t.name ? "text-primary" : "text-muted-foreground/60"
                  )}>
                    {t.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
