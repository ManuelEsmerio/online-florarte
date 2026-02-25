// src/app/admin/layout.tsx
'use client';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
  SidebarSubMenu,
  SidebarSubMenuContent,
  SidebarSubMenuTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Users,
  Package,
  Ticket,
  ShoppingBag,
  LayoutGrid,
  Home,
  LogOut,
  User as UserIcon,
  Settings,
  MapPin,
  LayoutList,
  MessageSquare,
  LayoutDashboard,
  CalendarHeart,
  Tags,
  CalendarClock,
  Gem,
  FileImage,
  Mail,
  FileUp,
  FileDown,
  LineChart,
  ChevronDown,
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import React, { useEffect, useState, Suspense } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ThemeCustomizer } from './ThemeCustomizer';
import { ThemeProvider } from '@/components/ThemeProvider';
import { ProductProvider } from '@/context/ProductContext';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Isotype } from '@/components/icons/Isotype';

function PageLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setProgress(0);
    setIsVisible(true);
    
    const timer = setTimeout(() => setProgress(30), 10);
    const timer2 = setTimeout(() => setProgress(70), 250);

    return () => {
      clearTimeout(timer);
      clearTimeout(timer2);
      setProgress(100);
      setTimeout(() => setIsVisible(false), 300);
    };
  }, [pathname, searchParams]);

  if (!isVisible) return null;

  return (
    <Progress 
      value={progress} 
      className="fixed top-0 left-0 right-0 h-0.5 w-full z-50 bg-transparent"
      style={{
        transition: 'width 0.2s ease-out, opacity 0.3s ease-out',
        opacity: progress < 100 ? 1 : 0
      }}
    />
  );
}

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);
  const { state: sidebarState } = useSidebar();
  const isCollapsed = sidebarState === 'collapsed';
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient && (!user || user.role !== 'admin')) {
      router.push('/login');
    }
  }, [user, router, isClient]);

  if (!isClient || !user || user.role !== 'admin') {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <LoadingSpinner />
      </div>
    );
  }

  const menuItems = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutGrid },
    { href: '/admin/orders', label: 'Pedidos', icon: ShoppingBag },
    { href: '/admin/products', label: 'Productos', icon: Package },
    { href: '/admin/customers', label: 'Usuarios', icon: Users },
    { href: '/admin/coupons', label: 'Cupones', icon: Ticket },
    { href: '/admin/testimonials', label: 'Testimonios', icon: MessageSquare },
    { href: '/admin/shipping', label: 'Zonas de Envío', icon: MapPin },
    { href: '/admin/categories', label: 'Categorías', icon: LayoutList },
    { href: '/admin/occasions', label: 'Ocasiones', icon: CalendarHeart },
    { href: '/admin/tags', label: 'Etiquetas', icon: Tags },
    { href: '/admin/peak-dates', label: 'Fechas Pico', icon: CalendarClock },
    { href: '/admin/loyalty', label: 'Historial de Puntos', icon: Gem },
    { href: '/admin/ads', label: 'Anuncios', icon: FileImage },
    { href: '/admin/newsletter', label: 'Newsletter', icon: Mail },
  ];
  
  const advancedMenuItems = [
      { 
        label: 'Avanzado', 
        icon: Settings, 
        subItems: [
            { href: '/admin/import', label: 'Importar', icon: FileUp },
            { href: '/admin/export', label: 'Exportar', icon: FileDown },
            { href: '/admin/reports', label: 'Reportes', icon: LineChart },
        ]
      },
  ]

  return (
      <div className='flex min-h-screen bg-white dark:bg-zinc-950 text-foreground transition-colors duration-500'>
        <Sidebar className="border-r-border/50">
          <SidebarHeader className={cn("p-6 transition-all duration-300", isCollapsed && "p-2")}>
             <div className="flex flex-col items-center text-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="relative group cursor-pointer mb-4">
                    <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full scale-75 opacity-0 group-hover:opacity-100 transition-all duration-500" />
                    <Avatar className={cn(
                        "h-20 w-20 border-4 border-background shadow-lg transition-all duration-500 group-hover:scale-105 relative",
                        isCollapsed && "h-10 w-10 border-2"
                    )}>
                      <AvatarImage src={user.profilePic || undefined} />
                      <AvatarFallback className="bg-primary text-white font-bold text-2xl">
                        {user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="rounded-2xl border-none shadow-2xl p-2 min-w-[200px]">
                  <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-3 py-2">
                    Administrador
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-muted/50" />
                  <DropdownMenuItem className="rounded-xl my-1 py-2 font-medium" asChild>
                    <Link href="/admin/profile">
                      <UserIcon className="mr-2 h-4 w-4" />
                      <span>Mi Perfil</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={logout}
                    className="rounded-xl my-1 py-2 font-medium text-destructive focus:bg-destructive focus:text-white"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Cerrar Sesión</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
               <div className={cn(
                  "transition-all duration-300 transform",
                  isCollapsed ? "opacity-0 h-0 scale-90 pointer-events-none" : "opacity-100 h-auto scale-100"
               )}>
                <span className="text-lg font-bold font-headline block leading-tight">{user.name}</span>
                <span className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                  {user.email}
                </span>
              </div>
            </div>
          </SidebarHeader>
          <SidebarSeparator className="bg-border/30 mx-4" />
          <SidebarContent className={cn("px-4", isCollapsed && "px-2")}>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton
                    isActive={pathname === item.href}
                    asChild
                    tooltip={item.label}
                    className={cn(
                        "rounded-xl transition-all duration-300 font-bold text-xs uppercase tracking-widest h-11 px-4",
                        pathname === item.href ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-slate-500 hover:text-primary hover:bg-primary/5",
                        isCollapsed && "px-0 justify-center"
                    )}
                  >
                    <Link href={item.href}>
                      <item.icon className={cn("h-5 w-5 shrink-0", pathname === item.href ? "text-white" : "text-slate-400")} />
                      {!isCollapsed && <span>{item.label}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
               <SidebarSeparator className="my-4 bg-border/30" />
               {advancedMenuItems.map((item) => 
                 <SidebarSubMenu key={item.label}>
                    <SidebarSubMenuTrigger 
                        tooltip={item.label}
                        className={cn(
                            "rounded-xl transition-all duration-300 font-bold text-xs uppercase tracking-widest h-11 px-4 text-slate-500 hover:text-primary hover:bg-primary/5",
                            isCollapsed && "px-0 justify-center"
                        )}
                    >
                        <item.icon className={cn("h-5 w-5 shrink-0 text-slate-400")} />
                        {!isCollapsed && (
                            <>
                                <span className="ml-2">{item.label}</span>
                                <ChevronDown className="ml-auto h-4 w-4 shrink-0 transition-transform duration-300 data-[state=open]:rotate-180" />
                            </>
                        )}
                    </SidebarSubMenuTrigger>
                    <SidebarSubMenuContent>
                        {item.subItems.map(subItem => (
                            <SidebarMenuItem key={subItem.href}>
                                 <SidebarMenuButton 
                                    isActive={pathname === subItem.href} 
                                    asChild
                                    className={cn(
                                        "rounded-xl transition-all duration-300 font-bold text-[10px] uppercase tracking-widest h-10 px-4",
                                        pathname === subItem.href ? "bg-slate-900 text-white shadow-lg" : "text-slate-400 hover:text-primary"
                                    )}
                                 >
                                    <Link href={subItem.href}>
                                        <subItem.icon className="mr-2 h-3.5 w-3.5" />
                                        {subItem.label}
                                    </Link>
                                 </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    </SidebarSubMenuContent>
                </SidebarSubMenu>
               )}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className={cn("p-4 transition-all duration-300", isCollapsed && "p-2")}>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip="Ver Tienda"
                  className={cn(
                      "rounded-xl h-12 px-4 font-bold text-xs uppercase tracking-widest border border-border/50 hover:bg-slate-50",
                      isCollapsed && "px-0 justify-center"
                  )}
                >
                  <Link href="/">
                    <Home className="h-5 w-5 shrink-0 text-slate-400" />
                    {!isCollapsed && <span>Ver Tienda</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <div className="flex w-full flex-col">
          <header className="sticky top-0 z-30 flex h-20 items-center gap-4 border-b border-border/50 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl px-6">
            <SidebarTrigger className="h-10 w-10 rounded-full hover:bg-slate-100" />
            <div className="hidden md:flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-lg shadow-primary/20">
                <Isotype className="h-6 w-6 brightness-0 invert" />
              </div>
              <h1 className="font-headline text-2xl font-bold tracking-tight">
                Florarte <span className="text-primary italic">Admin</span>
              </h1>
            </div>

            <div className="ml-auto flex items-center gap-4">
              <ThemeCustomizer />
              <div className="h-8 w-px bg-border/50 hidden sm:block" />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full relative group">
                    <div className="absolute inset-0 bg-primary/10 rounded-full scale-0 group-hover:scale-100 transition-transform" />
                    <Avatar className="h-8 w-8 relative border border-border/50">
                      <AvatarImage src={user.profilePic || undefined} />
                      <AvatarFallback className="bg-primary/5 text-primary text-[10px] font-bold">
                        {user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-2xl border-none shadow-2xl p-2 min-w-[200px]">
                  <DropdownMenuLabel className="font-bold text-sm px-3 py-2">
                    Hola, {user.name.split(' ')[0]}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-muted/50" />
                  <DropdownMenuItem className="rounded-xl font-medium" asChild>
                    <Link href="/admin/profile">
                        <UserIcon className="mr-2 h-4 w-4" /> Perfil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={logout}
                    className="rounded-xl font-medium text-destructive focus:bg-destructive focus:text-white"
                  >
                    <LogOut className="mr-2 h-4 w-4" /> Cerrar Sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </div>
  );
}

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    const savedTheme = localStorage.getItem('admin-color-theme') || 'theme-default';
    document.body.className.split(' ').forEach(c => {
      if(c.startsWith('theme-')) {
        document.body.classList.remove(c);
      }
    });
    document.body.classList.add(savedTheme);
  }, []);

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      storageKey="admin-ui-theme"
    >
      <ProductProvider>
        <SidebarProvider>
          <Suspense fallback={null}>
              <PageLoader />
          </Suspense>
          <AdminLayoutContent>{children}</AdminLayoutContent>
        </SidebarProvider>
      </ProductProvider>
    </ThemeProvider>
  );
}

export default AdminLayout;
