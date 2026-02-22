
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Announcement } from '@/lib/definitions';

interface AdCardProps {
  ad: Partial<Announcement> & { size?: 'single' | 'double' };
  className?: string;
}

export function AdCard({ ad, className }: AdCardProps) {
  return (
    <Card className={cn(
      "relative flex items-end justify-center overflow-hidden rounded-lg shadow-lg transition-all duration-300 group h-full",
      ad.size === 'double' ? 'lg:col-span-2' : 'lg:col-span-1',
      className
    )}>
      <Image
        src={ad.image_url || '/placehold.webp'}
        alt={ad.title || 'Anuncio'}
        layout="fill"
        objectFit="cover"
        className="z-0 brightness-50 transition-transform duration-500 group-hover:scale-110 group-hover:brightness-75"
      />
      <div className="relative z-10 p-6 text-center text-white">
        {ad.title && <h3 className="text-xl font-bold uppercase tracking-wider">{ad.title}</h3>}
        {ad.button_text && ad.button_link && (
            <Button asChild className="mt-4" variant="secondary">
            <Link href={ad.button_link}>{ad.button_text}</Link>
            </Button>
        )}
      </div>
    </Card>
  );
}
