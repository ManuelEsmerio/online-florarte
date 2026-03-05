import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Toaster } from 'sonner';
import { cn } from '@/lib/utils';
import { CartProvider } from '@/context/CartContext';
import { AuthProvider } from '@/context/AuthContext';
import { Inter, Playfair_Display } from 'next/font/google';
import GlobalComponents from '@/components/GlobalComponents';
import { ThemeProvider } from '@/components/ThemeProvider';
import { ReactQueryProvider } from '@/providers/ReactQueryProvider';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://floreriaflorarte.com';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Florería Florarte en Tequila, Jalisco - Flores a Domicilio en Región Valles',
    template: `%s - Florería Florarte`
  },
  description:
    'Florería Florarte, tu mejor opción en Tequila, Jalisco. Enviamos flores y regalos a domicilio en toda la Región Valles. Arreglos florales, ramos y plantas para toda ocasión. ¡Compra ahora!',
  icons: {
    icon: '/florarte_favicon.ico',
  },
  openGraph: {
    title: 'Florería Florarte en Tequila, Jalisco',
    description: 'Enviamos flores y regalos a domicilio en toda la Región Valles.',
    url: siteUrl,
    siteName: 'Florería Florarte',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Florería Florarte',
      },
    ],
    locale: 'es_MX',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Florería Florarte en Tequila, Jalisco',
    description: 'Enviamos flores y regalos a domicilio en toda la Región Valles.',
    images: ['/og-image.png'],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#e6518e' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
}

const fontSans = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
  weight: ['300', '400', '500', '600', '700'],
});

const fontHeadline = Playfair_Display({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-headline',
  weight: ['500', '600', '700']
});


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={cn('min-h-screen bg-background font-sans antialiased', fontSans.variable, fontHeadline.variable)}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          storageKey="florarte-theme"
        >
          <ReactQueryProvider>
            <AuthProvider>
              <CartProvider>
                  {children}
                  <Toaster position="bottom-left" richColors closeButton expand={false} />
                  <GlobalComponents />
              </CartProvider>
            </AuthProvider>
          </ReactQueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
