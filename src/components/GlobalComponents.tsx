
'use client';

import { usePathname } from 'next/navigation';
import FloatingWhatsApp from './FloatingWhatsApp';
import { CookieConsentBanner } from './CookieConsentBanner';

const GlobalComponents = () => {
  const pathname = usePathname();

  const isAdminRoute = pathname.startsWith('/admin');

  // Solo ocultamos el banner en rutas de autenticación para no interrumpir el flujo crítico
  const isAuthRoute = 
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/reset-password');


  if (isAdminRoute) {
    return null;
  }

  return (
    <>
      <FloatingWhatsApp />
      {!isAuthRoute && <CookieConsentBanner />}
    </>
  );
};

export default GlobalComponents;
