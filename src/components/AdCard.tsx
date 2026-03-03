
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
  const imageSrc = ad.imageUrl ?? (ad as any)?.image_url ?? '/placehold.webp';
  const buttonText = ad.buttonText ?? (ad as any)?.button_text;
  const buttonLink = ad.buttonLink ?? (ad as any)?.button_link;

  return (
    <Card
      className={cn(
        'relative flex items-end justify-center overflow-hidden rounded-3xl shadow-lg transition-all duration-300 group h-full',
        ad.size === 'double' ? 'lg:col-span-2' : 'lg:col-span-1',
        className
      )}
    >
      <Image
        src={imageSrc}
        alt={ad.title || 'Anuncio'}
        fill
        className="z-0 object-cover brightness-50 transition-transform duration-500 group-hover:scale-105 group-hover:brightness-80"
        sizes="(max-width: 768px) 100vw, 50vw"
        priority={false}
      />
      <div className="relative z-10 p-6 text-center text-white">
        {ad.title && (
          <h3 className="text-xl font-bold uppercase tracking-wider drop-shadow-md">{ad.title}</h3>
        )}
        {buttonText && buttonLink && (
          <Button asChild className="mt-4 rounded-xl px-6" variant="secondary">
            <Link href={buttonLink}>{buttonText}</Link>
          </Button>
        )}
      </div>
    </Card>
  );
}
