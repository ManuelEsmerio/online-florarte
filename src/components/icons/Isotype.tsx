// src/components/icons/Isotype.tsx
import { cn } from '@/lib/utils';
import Image from 'next/image';
import type { SVGProps } from 'react';

export function Isotype(props: SVGProps<SVGSVGElement> & { className?: string }) {
  return (
    <Image
      src="/Logo_Flor.svg"
      alt="Florarte Flor"
      width={40}
      height={40}
      className={cn(props.className)}
      priority
    />
  );
}
