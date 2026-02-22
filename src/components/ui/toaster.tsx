
"use client"

import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { CheckCircle, AlertTriangle, AlertCircle, XCircle } from "lucide-react"
import React, { useEffect, useState } from "react"

const iconMap = {
  success: <CheckCircle className="h-6 w-6 text-current" />,
  destructive: <XCircle className="h-6 w-6 text-current" />,
  info: <AlertCircle className="h-6 w-6 text-current" />,
  warning: <AlertTriangle className="h-6 w-6 text-current" />,
}

export function Toaster() {
  const { toasts, pauseToast, resumeToast } = useToast()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return null
  }

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        const Icon = variant ? iconMap[variant as keyof typeof iconMap] : null
        
        return (
          <Toast
            key={id}
            variant={variant}
            onMouseEnter={() => pauseToast(id)}
            onMouseLeave={() => resumeToast(id)}
            onFocus={() => pauseToast(id)}
            onBlur={() => resumeToast(id)}
            {...props}
          >
            <div className="flex items-start space-x-4 w-full pt-2">
              {Icon && <div className="flex-shrink-0 pt-0.5">{Icon}</div>}
              <div className="grid flex-1 gap-1">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && <ToastDescription>{description}</ToastDescription>}
              </div>
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
