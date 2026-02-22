// src/app/contact/page.tsx
'use client';

import Header from '@/components/Header';
import { Footer } from '@/components/Footer';
import ContactSection from '@/components/ContactSection';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';

export default function ContactPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-grow bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
           <Breadcrumb className="hidden md:flex">
                <BreadcrumbList className="text-[10px] uppercase tracking-[0.2em] font-bold">
                <BreadcrumbItem>
                    <BreadcrumbLink href="/" className="hover:text-primary transition-colors">Inicio</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="text-muted-foreground/30">›</BreadcrumbSeparator>
                 <BreadcrumbItem>
                    <BreadcrumbPage className="text-foreground">Contacto</BreadcrumbPage>
                 </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
        </div>
        <ContactSection />
      </main>
      <Footer />
    </div>
  );
}
