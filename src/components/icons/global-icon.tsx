import { cn } from '@/lib/utils';
import Image from 'next/image';
import type { SVGProps } from 'react';

export function GlobalIcon(props: SVGProps<SVGSVGElement> & { className?: string, src: string, alt: string, width?: number, height?: number }) {
  return (
    <Image
      src={props.src}
      alt={props.alt}
      width={props.width || 40}
      height={props.height || 40}
      className={cn(props.className)}
      priority
    />
  );
}
