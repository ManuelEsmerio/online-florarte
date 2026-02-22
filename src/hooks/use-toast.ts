
"use client"

import { toast as sonner } from "sonner"

/**
 * Hook de compatibilidad que mapea la API de shadcn toast hacia Sonner.
 * Permite que toda la aplicación use Sonner sin cambiar cada archivo.
 */
export function useToast() {
  return {
    toast: ({ title, description, variant, action, duration, ...props }: any) => {
      const options = {
        description,
        duration: duration || 4000,
      };

      if (variant === 'destructive' || variant === 'error') {
        return sonner.error(title, options);
      }
      if (variant === 'success') {
        return sonner.success(title, options);
      }
      if (variant === 'info') {
        return sonner.info(title, options);
      }
      if (variant === 'warning') {
        return sonner.warning(title, options);
      }
      return sonner(title, options);
    },
    dismiss: (id?: string | number) => sonner.dismiss(id),
  }
}

// Exportamos una versión directa para componentes que no necesitan el hook
export const toast = {
    success: (title: string, description?: string) => sonner.success(title, { description }),
    error: (title: string, description?: string) => sonner.error(title, { description }),
    info: (title: string, description?: string) => sonner.info(title, { description }),
    warning: (title: string, description?: string) => sonner.warning(title, { description }),
    message: (title: string, description?: string) => sonner(title, { description }),
};
