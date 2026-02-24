
"use client";

import { useCart } from "@/context/CartContext";
import { Button } from "./ui/button";
import { ShoppingBag, X, Minus, Plus, Trash2 } from "lucide-react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "./ui/sheet";
import Image from 'next/image';
import { useEffect, useState } from "react";
import Link from "next/link";
import { Skeleton } from "./ui/skeleton";

const CartItemSkeleton = () => (
    <div className="flex gap-4 py-4 animate-pulse">
        <Skeleton className="w-24 h-24 rounded-lg flex-shrink-0" />
        <div className="flex flex-col flex-1 space-y-3">
            <div className="space-y-2">
                <Skeleton className="h-5 w-3/4 rounded" />
                <Skeleton className="h-3 w-1/4 rounded" />
            </div>
            <div className="mt-auto flex items-center justify-between">
                <Skeleton className="h-8 w-24 rounded-full" />
                <Skeleton className="h-6 w-16 rounded" />
            </div>
        </div>
    </div>
);

const ShoppingCartButton = () => {
    const { cart, cartItemCount, updateQuantity, removeFromCart, isCartOpen, setCartOpen, updatingItemId, isLoading, subtotal, clearCart } = useCart();
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);
    
    const handleRemove = (e: React.MouseEvent, cartItemId: string) => {
        e.stopPropagation();
        removeFromCart(cartItemId);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
    };

    return (
        <Sheet open={isCartOpen} onOpenChange={setCartOpen}>
            <SheetTrigger asChild>
                 <Button variant="ghost" size="icon" aria-label="Shopping Cart" className="relative h-10 w-10 md:h-11 md:w-11 hover:bg-primary/5 hover:text-primary dark:hover:bg-primary dark:hover:text-white rounded-xl">
                    <ShoppingBag className="h-5 w-5 md:h-6 md:w-6" />
                    {isClient && cartItemCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground animate-in fade-in zoom-in">
                            {cartItemCount}
                        </span>
                    )}
                </Button>
            </SheetTrigger>
            <SheetContent 
                hideCloseButton={true}
                className="w-full sm:max-w-md p-0 overflow-hidden border-none shadow-2xl bg-background dark:bg-[#0F0F0F] flex flex-col h-screen"
            >
                {/* Header */}
                <div className="px-8 pt-10 pb-6 flex items-center justify-between shrink-0">
                    <SheetTitle className="font-headline text-3xl font-medium tracking-tight">Carrito de Compras</SheetTitle>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => setCartOpen(false)}
                        className="rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors h-10 w-10"
                    >
                        <X className="h-6 w-6 text-slate-400 hover:text-primary" />
                    </Button>
                </div>

                {/* Items List */}
                <div className="flex-1 overflow-y-auto px-8 custom-scrollbar">
                    {isLoading && cart.length === 0 ? (
                        <div className="space-y-8 py-4">
                            {Array.from({ length: 3 }).map((_, i) => <CartItemSkeleton key={i} />)}
                        </div>
                    ) : cart && cart.length > 0 ? (
                        <div className="space-y-8 py-4">
                            {cart.map((item) => {
                                const isUpdating = updatingItemId === item.cartItemId;
                                if(isUpdating) return <CartItemSkeleton key={item.cartItemId} />;

                                return (
                                    <div key={item.cartItemId} className="flex gap-4 group animate-fade-in-up">
                                        <div className="w-24 h-24 flex-shrink-0 bg-slate-50 dark:bg-zinc-900 rounded-lg overflow-hidden border border-slate-100 dark:border-zinc-800 relative">
                                            <Image 
                                                src={item.image || '/placehold.webp'} 
                                                alt={item.name} 
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                        <div className="flex flex-col flex-1">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="font-medium text-lg leading-tight mb-1 line-clamp-2">{item.name}</h3>
                                                    <p className="text-[10px] text-slate-400 dark:text-zinc-500 uppercase tracking-widest font-mono">SKU: {item.code}</p>
                                                </div>
                                                <button 
                                                    onClick={(e) => handleRemove(e, item.cartItemId)}
                                                    className="text-slate-300 hover:text-primary transition-colors p-1"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                            <div className="mt-auto flex items-center justify-between pt-3">
                                                <div className="flex items-center border border-slate-200 dark:border-zinc-800 rounded-full p-1 bg-slate-50/50 dark:bg-zinc-900/50 h-9">
                                                    <button 
                                                        className="w-7 h-7 flex items-center justify-center hover:bg-white dark:hover:bg-zinc-800 rounded-full transition-all disabled:opacity-20"
                                                        onClick={(e) => { e.stopPropagation(); updateQuantity(item.cartItemId, item.quantity - 1); }}
                                                        disabled={item.quantity <= 1}
                                                    >
                                                        <Minus className="h-3 w-3" />
                                                    </button>
                                                    <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                                                    <button 
                                                        className="w-7 h-7 flex items-center justify-center hover:bg-white dark:hover:bg-zinc-800 rounded-full transition-all"
                                                        onClick={(e) => { e.stopPropagation(); updateQuantity(item.cartItemId, item.quantity + 1); }}
                                                    >
                                                        <Plus className="h-3 w-3" />
                                                    </button>
                                                </div>
                                                <span className="font-semibold text-lg">{formatCurrency(item.price * item.quantity)}</span>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                            
                            <div className="pt-4 flex justify-center">
                                <button 
                                    onClick={clearCart}
                                    className="text-[10px] uppercase tracking-[0.2em] text-slate-400 hover:text-primary transition-colors flex items-center gap-2 font-bold"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    Vaciar carrito
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-grow flex flex-col items-center justify-center text-center h-full py-20">
                            <div className="w-20 h-20 bg-muted/30 rounded-full flex items-center justify-center mb-6">
                                <ShoppingBag className="w-10 h-10 text-muted-foreground/30" />
                            </div>
                            <h3 className="text-xl font-bold font-headline mb-2">Tu carrito está vacío</h3>
                            <p className="text-muted-foreground text-sm max-w-[240px] mx-auto leading-relaxed">
                                ¡Añade flores y regalos para alegrar el día de alguien hoy mismo!
                            </p>
                            <Button variant="link" className="mt-6 text-primary font-bold" asChild>
                                <Link href="/products/all" onClick={() => setCartOpen(false)}>Explorar catálogo</Link>
                            </Button>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-8 border-t border-slate-100 dark:border-zinc-800 space-y-6 shrink-0 bg-background dark:bg-[#0F0F0F]">
                    <div className="space-y-2">
                        <div className="flex justify-between text-slate-500 dark:text-zinc-400">
                            <span className="text-sm font-medium">Subtotal</span>
                            <span className="font-semibold">{formatCurrency(subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-slate-500 dark:text-zinc-400">
                            <span className="text-sm font-medium">Envío</span>
                            <span className="text-[10px] uppercase tracking-widest font-bold opacity-60 italic">Al ingresar la dirección</span>
                        </div>
                        <div className="flex justify-between pt-4">
                            <span className="text-xl font-medium font-headline">Total</span>
                            <span className="text-2xl font-bold text-primary">{formatCurrency(subtotal)}</span>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <Button 
                            className="w-full h-14 bg-primary hover:bg-[#E6286B] text-white rounded-full font-bold text-lg shadow-xl shadow-primary/20 hover:shadow-primary/40 active:scale-[0.98] transition-all border-none"
                            asChild={cartItemCount > 0}
                            disabled={cartItemCount === 0}
                        >
                            {cartItemCount > 0 ? (
                                <Link href="/cart" onClick={() => setCartOpen(false)}>Finalizar Compra</Link>
                            ) : (
                                <span>Finalizar Compra</span>
                            )}
                        </Button>
                        <Button 
                            variant="outline" 
                            className="w-full h-12 border-slate-200 dark:border-zinc-700 rounded-full font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-zinc-900 transition-colors"
                            onClick={() => setCartOpen(false)}
                        >
                            Seguir comprando
                        </Button>
                    </div>
                </div>
            </SheetContent>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e2e8f0;
                    border-radius: 10px;
                }
                .dark .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #333;
                }
            `}</style>
        </Sheet>
    );
}

export default ShoppingCartButton;
