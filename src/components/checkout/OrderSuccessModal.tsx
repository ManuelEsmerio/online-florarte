
'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle, ShoppingBag, Truck, Calendar, Flower2, Facebook, Instagram, Twitter } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useCart } from '@/context/CartContext';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface OrderSuccessModalProps {
    isOpen: boolean;
    orderId: number;
}

const COUNTDOWN_SECONDS = 15;

export function OrderSuccessModal({ isOpen, orderId }: OrderSuccessModalProps) {
    const router = useRouter();
    const { deliveryDate } = useCart();
    const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Efecto 1: Gestionar el intervalo del contador
    useEffect(() => {
        if (isOpen) {
            setCountdown(COUNTDOWN_SECONDS);
            timerRef.current = setInterval(() => {
                setCountdown(prev => (prev > 0 ? prev - 1 : 0));
            }, 1000);
        }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isOpen]);

    // Efecto 2: Gestionar la redirección (Side Effect seguro)
    useEffect(() => {
        if (isOpen && countdown === 0) {
            if (timerRef.current) clearInterval(timerRef.current);
            router.push('/');
        }
    }, [countdown, isOpen, router]);

    const progressValue = (countdown / COUNTDOWN_SECONDS) * 100;

    const formattedDeliveryDate = useMemo(() => {
        if (!deliveryDate) return 'Próximamente';
        try {
            return format(parseISO(deliveryDate), "d 'de' MMMM", { locale: es });
        } catch (e) {
            return deliveryDate;
        }
    }, [deliveryDate]);

    return (
        <Dialog open={isOpen} onOpenChange={() => {}}>
            <DialogContent 
                className="sm:max-w-lg p-0 overflow-hidden border-none shadow-2xl rounded-[2.5rem] bg-background/80 backdrop-blur-xl"
                onInteractOutside={(e) => e.preventDefault()}
                hideCloseButton={true}
            >
                <div className="relative overflow-hidden p-8 md:p-12 flex flex-col items-center text-center space-y-8">
                    {/* Fondo decorativo floral sutil */}
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none -z-10">
                        <Flower2 className="w-full h-full scale-150 text-primary" />
                    </div>

                    {/* Animación de Éxito */}
                    <div className="relative">
                        <div className="absolute inset-0 animate-pulse bg-green-500/20 blur-3xl rounded-full"></div>
                        <div className="relative w-24 h-24 flex items-center justify-center rounded-full border-2 border-green-500/30 bg-background/50">
                            <CheckCircle className="w-16 h-16 text-green-500 animate-in zoom-in duration-500" />
                            <Flower2 className="absolute -top-2 -left-2 text-green-400 w-6 h-6 opacity-40 animate-bounce" />
                        </div>
                    </div>

                    {/* Títulos */}
                    <div className="space-y-3">
                        <DialogTitle className="font-headline text-3xl md:text-4xl font-bold tracking-tight text-foreground">
                            ¡Gracias por florecer con nosotros!
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground font-medium">
                            Hemos recibido tu pedido con mucho cariño.
                        </DialogDescription>
                    </div>

                    {/* Tarjeta de Resumen del Pedido */}
                    <div className="w-full bg-muted/30 dark:bg-white/5 rounded-3xl p-5 border border-border/50 flex items-center space-x-5 text-left transition-all hover:bg-muted/40">
                        <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-lg flex-shrink-0 relative">
                            <Image 
                                src="https://picsum.photos/seed/success/200/200" 
                                alt="Ramo de flores frescas" 
                                fill 
                                className="object-cover"
                                data-ai-hint="flower bouquet"
                            />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary mb-1 font-sans">ORDEN #ORD{String(orderId).padStart(4, '0')}</p>
                            <h3 className="font-headline text-lg font-bold text-foreground leading-tight truncate">Tu detalle floral</h3>
                            <div className="flex items-center mt-2 text-muted-foreground text-xs">
                                <Calendar className="w-3.5 h-3.5 mr-1.5 text-primary" />
                                <span className="font-sans">Llegará el {formattedDeliveryDate}</span>
                            </div>
                        </div>
                    </div>

                    {/* Botones de Acción */}
                    <div className="w-full flex flex-col space-y-3">
                        <Button 
                            asChild 
                            className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-bold rounded-full transition-all duration-300 transform hover:scale-[1.02] shadow-xl shadow-primary/20 gap-2"
                        >
                            <Link href="/products/all">
                                <ShoppingBag className="w-5 h-5" />
                                Seguir comprando
                            </Link>
                        </Button>
                        <Button 
                            asChild 
                            variant="outline" 
                            className="w-full h-14 bg-transparent border-2 border-primary/20 hover:border-primary text-primary font-bold rounded-full transition-all duration-300 gap-2"
                        >
                            <Link href="/orders">
                                <Truck className="w-5 h-5" />
                                Ver mis pedidos
                            </Link>
                        </Button>
                    </div>

                    {/* Compartir en Redes */}
                    <div className="space-y-3 pt-2">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em] font-sans">Comparte tu elección</p>
                        <div className="flex justify-center space-x-6">
                            <button className="text-muted-foreground hover:text-primary transition-colors active:scale-90">
                                <Facebook className="w-5 h-5" />
                            </button>
                            <button className="text-muted-foreground hover:text-primary transition-colors active:scale-90">
                                <Instagram className="w-5 h-5" />
                            </button>
                            <button className="text-muted-foreground hover:text-primary transition-colors active:scale-90">
                                <Twitter className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Barra de progreso y cuenta regresiva */}
                    <div className="w-full space-y-3 pt-4">
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-bold font-sans">
                            Redirigiendo a la tienda en <span className="text-primary font-sans">{countdown}</span>s...
                        </p>
                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-primary transition-all duration-1000 ease-linear"
                                style={{ width: `${progressValue}%` }}
                            />
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
