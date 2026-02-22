
'use client';
import { useEffect } from 'react';
import { ensureCartSessionId } from '@/utils/cart-session';

export default function CartSessionBootstrap() {
  useEffect(() => {
    ensureCartSessionId(); // se ejecuta 1 sola vez en cliente
  }, []);
  return null;
}
