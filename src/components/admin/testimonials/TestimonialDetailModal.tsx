// src/components/admin/testimonials/TestimonialDetailModal.tsx
'use client';

import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Testimonial } from '@/lib/definitions';
import { Star } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const TestimonialDetailModal = ({
  testimonial,
}: {
  testimonial: Testimonial;
}) => {
  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Detalle del Testimonio</DialogTitle>
        <DialogDescription>
          De {testimonial.userName} sobre el pedido ORD
          {String(testimonial.orderId).padStart(4, '0')}
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div className="flex items-center">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`h-6 w-6 ${
                i < testimonial.rating
                  ? 'text-yellow-400 fill-yellow-400'
                  : 'text-muted-foreground'
              }`}
            />
          ))}
        </div>
        <p className="text-muted-foreground italic bg-muted/50 p-4 rounded-md">
          "{testimonial.comment}"
        </p>
        <div className="text-sm text-muted-foreground">
          <p>
            <strong>Autor:</strong> {testimonial.userName}
          </p>
          <p>
            <strong>Fecha:</strong>{' '}
            {format(new Date(testimonial.createdAt), 'dd MMMM yyyy, h:mm a', {
              locale: es,
            })}
          </p>
          <p>
            <strong>Estado:</strong>{' '}
            <span className="capitalize font-medium">{testimonial.status}</span>
          </p>
        </div>
      </div>
    </DialogContent>
  );
};
