
// src/components/Header.tsx
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Menu, User, LogOut, LayoutDashboard, Search, Heart, Ticket, UserCircle, ShoppingBag, Gem, LogIn, UserPlus, PhoneCall, ShieldCheck, FileText, Scale, RefreshCw } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { Suspense, useEffect, useState } from 'react';
import { Isotype } from './icons/Isotype';
import { usePathname, useSearchParams } from 'next/navigation';
import { SearchDialog } from './SearchDialog';
import { ThemeToggle } from './ThemeToggle';
import { LoadingSpinner } from './LoadingSpinner';
import dynamic from 'next/dynamic';
import { WhatsAppIcon } from './icons/whatsapp-icon';

const ShoppingCartButton = dynamic(() => import('./ShoppingCartButton'), {
  ssr: false,
  loading: () => (
    <Button variant="ghost" size="icon" disabled>
      <ShoppingBag className="h-5 w-5" />
    </Button>
  ),
});


const HeaderContent = () => {
  const { user, logout, wishlist, loading } = useAuth();
  const [isClient, setIsClient] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    setIsClient(true);

    let rafId: number | null = null;
    const handleScroll = () => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        setIsScrolled(window.scrollY > 10);
        rafId = null;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, []);

  const navLinks = [
    { href: '/products/all', label: 'Ver Todo' },
    { href: '/categories/arreglos-florales', label: 'Arreglos' },
    { href: '/categories/ramos-florales', label: 'Ramos' },
    { href: '/categories/plantas', label: 'Plantas' },
    { href: '/categories/paquetes', label: 'Paquetes' },
    { href: '/categories/complementos', label: 'Complementos' }
  ];

  const userLinks = [
    { href: '/profile', label: 'Mi Perfil', icon: UserCircle },
    { href: '/orders', label: 'Mis Pedidos', icon: ShoppingBag },
    { href: '/coupons', label: 'Mis Cupones', icon: Ticket },
    { href: '/wishlist', label: 'Mi Wishlist', icon: Heart },
  ];

  const legalLinks = [
    { href: '/privacy-policy', label: 'Aviso de Privacidad', icon: ShieldCheck },
    { href: '/terms-and-conditions', label: 'Términos y Condiciones', icon: Scale },
    { href: '/shipping-policy', label: 'Políticas de Envío', icon: FileText },
    { href: '/cancellation-policy', label: 'Reembolsos', icon: RefreshCw },
    { href: '/contact', label: 'Contacto', icon: PhoneCall },
  ];

  const adminLinks = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  ];

  const normalizedRole = String(user?.role ?? '').toUpperCase();
  const isAdmin = normalizedRole === 'ADMIN';
  const isCustomer = normalizedRole === 'CUSTOMER';
  const accountLinks = isAdmin ? [...adminLinks, ...userLinks] : userLinks;

  const isLinkActive = (href: string) => {
    const [hrefPath] = href.split('?');
    return pathname.startsWith(hrefPath);
  };
  

  const handleMobileLinkClick = () => {
    setIsSheetOpen(false);
  }

  const renderUserAuth = () => {
    if (loading) {
      return <div className="w-24 h-10 flex items-center justify-center"><LoadingSpinner size={20} className='p-0' /></div>
    }

    if (user && user.name) {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex gap-2 relative overflow-hidden group transition-all duration-300 rounded-xl dark:hover:bg-primary dark:hover:text-white hover:bg-primary/5 hover:text-primary">
              <User className="h-5 w-5" />
              <span className="font-semibold text-base">¡Hola, {user.name.split(' ')[0]}!</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-2xl p-2 border-none shadow-2xl min-w-[200px] animate-in fade-in slide-in-from-top-2 duration-300">
            <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-3 py-2">Mi Cuenta</DropdownMenuLabel>
            {isCustomer && (
              <>
                <DropdownMenuSeparator className="bg-muted/50" />
                <DropdownMenuItem disabled className="!opacity-100 !cursor-default focus:bg-transparent rounded-xl">
                  <Gem className="mr-2 h-4 w-4 text-blue-500" />
                  <span className="font-medium">{user.loyaltyPoints || 0} Puntos</span>
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator className="bg-muted/50" />
            {accountLinks.map(link => (
              <DropdownMenuItem key={link.href} asChild className="rounded-xl">
                <Link href={link.href} className="w-full flex items-center py-2 transition-all duration-300">
                  <link.icon className="mr-2 h-4 w-4 transition-colors" />
                  <span className="font-medium transition-colors">{link.label}</span>
                </Link>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator className="bg-muted/50" />
            <DropdownMenuItem 
              onClick={logout} 
              className="rounded-xl text-destructive focus:text-destructive-foreground focus:bg-destructive transition-all duration-300 cursor-pointer"
            >
              <LogOut className="mr-2 h-4 w-4 transition-colors" />
              <span className="font-bold">Cerrar Sesión</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Cuenta" className="rounded-xl transition-all duration-300 hover:bg-primary/5 hover:text-primary">
            <User className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="rounded-2xl p-2 border-none shadow-2xl min-w-[180px] animate-in fade-in slide-in-from-top-2 duration-300">
          <DropdownMenuItem asChild className="rounded-xl">
            <Link href="/login" className="w-full flex items-center py-2 font-medium transition-all duration-300">
              <LogIn className="mr-2 h-4 w-4" />
              <span>Iniciar sesión</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="rounded-xl">
            <Link href="/register" className="w-full flex items-center py-2 font-medium transition-all duration-300">
              <UserPlus className="mr-2 h-4 w-4" />
              <span>Crear cuenta</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <header className={cn(
      "sticky top-0 z-40 w-full bg-background/80 backdrop-blur-sm transition-all duration-300",
      isScrolled ? 'border-b border-border shadow-sm' : 'border-b border-transparent'
    )}>
      <div className="mx-auto flex h-20 items-center justify-between px-4 md:px-6">
        <Link
          href="/"
          className="text-primary transition-transform duration-300 hover:scale-105 active:scale-95"
          aria-label="Ir a la página de inicio"
        >
          <Isotype className="h-12 w-auto" />
        </Link>
        <nav className="hidden items-center space-x-6 md:flex">
          {navLinks.map((link) => {
            const isActive = isLinkActive(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative text-sm font-medium transition-colors duration-300",

                  // Texto
                  isActive ? "text-primary" : "text-foreground/80 hover:text-primary",

                  // Línea animada
                  "after:absolute after:left-1/2 after:-bottom-1 after:h-[2px] after:w-0 after:bg-primary after:rounded-full after:transition-all after:duration-300 after:-translate-x-1/2",

                  // Hover
                  "hover:after:w-full",

                  // Activo fijo
                  isActive && "after:w-full"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="hidden items-center space-x-2 md:flex">
            <>
              <SearchDialog />
              <ThemeToggle />
              <Button
                variant="ghost"
                size="icon"
                asChild
                className="relative group transition-all duration-300 hover:bg-primary/5 hover:text-primary dark:hover:bg-primary dark:hover:text-white rounded-xl"
              >
                <Link href="/wishlist" aria-label="Wishlist">
                  <Heart className={cn("h-5 w-5 transition-all group-hover:scale-110", wishlist.length > 0 && "fill-primary text-primary")} />
                  {wishlist.length > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground animate-in fade-in zoom-in">
                      {wishlist.length}
                    </span>
                  )}
                </Link>
              </Button>
              {renderUserAuth()}
            </>
          <ShoppingCartButton />
        </div>
        <div className="md:hidden flex items-center gap-2">
          <SearchDialog />
          <ThemeToggle />
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open Menu" className="rounded-xl hover:bg-primary/5 hover:text-primary">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="flex flex-col p-0 border-none rounded-l-[2rem] shadow-2xl">
              <SheetTitle className="sr-only">Menú de Navegación</SheetTitle>
              <div className="flex-grow overflow-y-auto p-6 space-y-8">
                <Link
                  href="/"
                  className="text-primary"
                  onClick={handleMobileLinkClick}
                  aria-label="Ir a la página de inicio"
                >
                  <Isotype className="h-16 w-auto" />
                </Link>

                {isClient && user && user.name && (
                  <nav className="flex flex-col space-y-4 border-b border-border/50 pb-6">
                    <p className="font-bold text-muted-foreground text-[10px] uppercase tracking-[0.2em]">Mi Cuenta</p>
                    {isCustomer && (
                      <div className="flex items-center gap-3 text-lg font-medium text-foreground/80">
                        <Gem className="w-5 h-5 text-blue-500" />
                        <span>{user.loyaltyPoints || 0} Puntos</span>
                      </div>
                    )}
                    {accountLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={handleMobileLinkClick}
                        className="link-underline text-lg font-medium text-foreground/80 transition-all hover:text-primary flex items-center gap-3"
                      >
                        <link.icon className="w-5 h-5" />
                        {link.label}
                      </Link>
                    ))}
                  </nav>
                )}


                <nav className="flex flex-col space-y-4">
                  <p className="font-bold text-muted-foreground text-[10px] uppercase tracking-[0.2em]">Catálogo</p>
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={handleMobileLinkClick}
                      className={cn(
                        "text-lg font-medium transition-all hover:text-primary",
                        isLinkActive(link.href) ? 'text-primary font-bold' : 'text-foreground/80'
                      )}
                    >
                      {link.label}
                    </Link>
                  ))}
                </nav>

                <nav className="flex flex-col space-y-4 border-t border-border/50 pt-6">
                  <p className="font-bold text-muted-foreground text-[10px] uppercase tracking-[0.2em]">Legal y Ayuda</p>
                  <div className="grid grid-cols-1 gap-3">
                    {legalLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={handleMobileLinkClick}
                        className="text-sm text-foreground/70 hover:text-primary transition-all flex items-center gap-3 py-1"
                      >
                        <link.icon className="w-4 h-4 text-muted-foreground/50" />
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </nav>
              </div>
              <div className="flex items-center justify-between border-t p-4 bg-muted/20">
                {isClient && user ? (
                  <Button onClick={() => { logout(); handleMobileLinkClick(); }} variant="ghost" className="text-destructive rounded-xl gap-2 px-3" aria-label="Cerrar Sesión">
                    <LogOut className="h-5 w-5" />
                    <span className="text-sm font-medium">Salir</span>
                  </Button>
                ) : (
                  <Button asChild variant="outline" className="rounded-xl font-bold">
                    <Link href="/login" onClick={handleMobileLinkClick}>
                      <LogIn className="mr-2 h-5 w-5" />
                      Iniciar Sesión
                    </Link>
                  </Button>
                )}
                <div className='flex items-center gap-2'>
                  <Button
                    variant="ghost"
                    size="icon"
                    asChild
                    className="relative group h-11 w-11 rounded-xl"
                  >
                    <Link href="/wishlist" onClick={handleMobileLinkClick} aria-label="Wishlist">
                      <Heart className={cn("h-6 w-6 transition-all group-hover:scale-110", wishlist.length > 0 && "fill-primary text-primary")} />
                      {wishlist.length > 0 && (
                        <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground animate-in fade-in zoom-in">
                          {wishlist.length}
                        </span>
                      )}
                    </Link>
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    asChild
                    className="h-11 w-11 rounded-xl"
                  >
                    <Link href="https://wa.me/523741109133" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
                      <WhatsAppIcon className="h-6 w-6" />
                    </Link>
                  </Button>

                  <ShoppingCartButton />
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

const Header = () => (
  <Suspense fallback={<div className="h-20" />}>
    <HeaderContent />
  </Suspense>
);

export default Header;
