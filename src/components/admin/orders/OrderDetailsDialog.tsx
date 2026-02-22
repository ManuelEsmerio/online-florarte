'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { handleApiResponse } from '@/utils/handleApiResponse';
import type { Order, OrderStatus } from '@/lib/definitions';
import {
  Download,
  Truck,
  Calendar as CalendarIcon,
  MessageSquare,
  ImageIcon,
} from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import Image from 'next/image';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatTimeSlotForUI } from '@/lib/utils';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

const statusStyles: { [key in OrderStatus]: string } = {
  pendiente: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800/50 dark:text-gray-300 dark:border-gray-700',
  completado: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-800',
  en_reparto: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-800',
  procesando: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-800',
  cancelado: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-800',
};

const statusTranslations: { [key in OrderStatus]: string } = {
  pendiente: 'Pendiente',
  procesando: 'En Proceso',
  en_reparto: 'En Reparto',
  completado: 'Completado',
  cancelado: 'Cancelado',
};

const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) return 'N/A';
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
}

export const OrderDetailsDialog = ({ orderId, trigger }: { orderId: number, trigger: React.ReactNode }) => {
    const { apiFetch } = useAuth();
    const { toast } = useToast();
    const [order, setOrder] = useState<Order | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

    const fetchOrderDetails = async () => {
        setIsLoading(true);
        try {
            const res = await apiFetch(`/api/admin/orders/${orderId}`);
            const data = await handleApiResponse(res);
            setOrder(data);
        } catch (error: any) {
            toast({ title: "Error", description: `No se pudieron cargar los detalles: ${error.message}`, variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    }
    
    // --- PDF Helper Functions ---
    const STATUS_STYLES: Record<string, {bg:[number,number,number]; fg:[number,number,number]}> = {
      'pendiente':        { bg:[107, 114, 128],  fg:[255,255,255] }, // gray-500
      'procesando':      { bg:[251,191,36],  fg:[48,48,48]   },  // amber
      'en_reparto':{ bg:[59,130,246],  fg:[255,255,255] }, // blue
      'completado':      { bg:[16,185,129], fg:[255,255,255] }, // green
      'cancelado':       { bg:[239,68,68],   fg:[255,255,255] }, // red
    };
    const getStatusStyle = (code: string) => STATUS_STYLES[code] ?? { bg:[107,114,128], fg:[255,255,255] };

    function drawStatusBadge(doc: jsPDF, text: string, xRight: number, y: number, bg: [number,number,number], fg: [number,number,number]) {
      doc.setFontSize(11).setFont('helvetica','bold');
      const padX = 4, padY = 2;
      const w = doc.getTextWidth(text) + padX*2;
      const h = 8;
      const x = xRight - w;
      const r = 3;
      doc.setFillColor(...bg);
      (doc as any).roundedRect(x, y - h + 2, w, h, r, r, 'F');
      doc.setTextColor(...fg);
      doc.text(text, x + padX, y, { baseline: 'bottom' });
      doc.setTextColor(0,0,0);
    }
    
    const imgCache = new Map<string, string>();

    function blobToDataURL(blob: Blob): Promise<string> {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
    }

    async function fetchToDataURL(url: string): Promise<string> {
      const res = await fetch(url, { mode: 'cors' });
      if (!res.ok) throw new Error('fetch failed');
      const blob = await res.blob();
      return blobToDataURL(blob);
    }

    async function htmlImageToDataURL(url: string): Promise<string> {
      const img = new (window as any).Image();
      img.crossOrigin = 'anonymous';
      img.decoding = 'async';
      img.referrerPolicy = 'no-referrer';
      img.src = url;

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('img onerror'));
      });

      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);

      const isWebp = /\.webp($|\?)/i.test(url);
      const mime = isWebp ? 'image/png' : 'image/png';
      return canvas.toDataURL(mime, 0.92);
    }
    
    async function loadDataURLForPDF(url?: string): Promise<string | null> {
      if (!url) return null;
      if (imgCache.has(url)) return imgCache.get(url)!;
      if (url.startsWith('data:image/')) {
        imgCache.set(url, url);
        return url;
      }
      const attempts: Array<() => Promise<string>> = [
        () => fetchToDataURL(url),
        () => htmlImageToDataURL(url),
      ];
      for (const attempt of attempts) {
        try {
          const dataURL = await attempt();
          imgCache.set(url, dataURL);
          return dataURL;
        } catch { /* next attempt */ }
      }
      return null;
    }

    const handleDownloadPdf = async () => {
        if (!order) return;
        setIsDownloadingPdf(true);
        try {
            const doc = new jsPDF();
            
            // --- Title ---
            doc.setFontSize(22).setFont('helvetica','bold');
            doc.text('Detalle del Pedido', 105, 22, { align:'center' });

            // --- Order ID (izq) + Estado con badge (der) ---
            let startY = 40;
            doc.setFontSize(11).setFont('helvetica','normal');
            doc.text(`Pedido: ORD${String(order.id).padStart(4, '0')}`, 14, startY);

            const statusCode = order.status;
            const statusText = `Estado: ${statusTranslations[statusCode] ?? order.status}`;
            const { bg, fg } = getStatusStyle(statusCode);
            drawStatusBadge(doc, statusText, 196, startY + 6, bg, fg);

            // --- Cliente y Enviar a ---
            startY += 15;
            const addr = (order.shippingAddress || '').split(', ').join('\n');
            doc.autoTable({
              startY,
              body: [[
                  { content:'CLIENTE', styles:{ fontStyle:'bold', textColor:'#333' } },
                  { content:'ENVIAR A', styles:{ fontStyle:'bold', textColor:'#333' } },
              ], [
                  `${order.customerName}\n${order.customerEmail ?? ''}`,
                  `${order.recipientName || order.customerName}\n${order.recipientPhone || ''}\n${addr}`
              ]],
              theme: 'plain',
              styles: { fontSize:10, cellPadding:{ top:0,right:0,bottom:2,left:0 } },
              columnStyles: { 0:{ cellWidth:70 }, 1:{ cellWidth:112 } },
              didDrawPage: (data: any) => { data.cursor.y += 5; }
            });
            startY = (doc as any).lastAutoTable.finalY + 5;
            doc.setLineWidth(0.2).line(14, startY, 196, startY);

            // --- Repartidor ---
            if (order.deliveryDriverName) {
                startY += 8;
                doc.autoTable({
                  startY,
                  body: [
                    [{ content:'REPARTIDOR', styles:{ fontStyle:'bold', textColor:'#333' } }],
                    [`Nombre: ${order.deliveryDriverName}`]
                  ],
                  theme:'plain',
                  styles:{ fontSize:10, cellPadding:{ top:0,right:0,bottom:2,left:0 } }
                });
                startY = (doc as any).lastAutoTable.finalY + 5;
                doc.setLineWidth(0.2).line(14, startY, 196, startY);
            }

            // --- Detalles de entrega ---
            startY += 8;
            const deliveryDateTime = `${format(new Date(order.delivery_date), 'PPP', { locale: es })} – ${formatTimeSlotForUI(order.delivery_time_slot)}`;
            doc.autoTable({
              startY,
              body: [
                [{ content:'DETALLES DE ENTREGA', styles:{ fontStyle:'bold', textColor:'#333' } }],
                [`Fecha y Hora: ${deliveryDateTime}`],
                [`Firma: ${order.is_anonymous ? 'Anónimo' : (order.signature || 'N/A')}`],
                [`Dedicación: ${order.dedication || 'N/A'}`]
              ],
              theme:'plain',
              styles:{ fontSize:10, cellPadding:{ top:0,right:0,bottom:2,left:0 } }
            });
            startY = (doc as any).lastAutoTable.finalY + 10;
            
            // --- Tabla de artículos ---
            doc.autoTable({
              startY,
              head: [['Artículo', 'Cant.', 'Precio Unit.', 'Subtotal']],
              body: (order.items || []).map(it => [
                `${it.product_name || 'Artículo'}`,
                it.quantity,
                formatCurrency(it.price),
                formatCurrency(it.price * it.quantity),
              ]),
              theme:'grid',
              headStyles:{ fillColor:[241,245,249], textColor:20, fontStyle:'bold', halign:'center' },
              styles:{ fontSize:10, cellPadding:3, minCellHeight: 15 },
            });

            // --- Totales ---
            let totalsY = (doc as any).lastAutoTable.finalY + 10;
            const totalsBody: any[] = [['Subtotal:', formatCurrency(order.subtotal)]];
            if (order.coupon_discount && order.coupon_discount > 0) {
              totalsBody.push(['Descuento:', `-${formatCurrency(order.coupon_discount)}`]);
            }
            totalsBody.push(['Envío:', formatCurrency(order.shipping_cost || 0)]);

            doc.autoTable({
              startY: totalsY, body: totalsBody, theme: 'plain', styles: { fontSize: 10, cellPadding: 1 },
              columnStyles: { 0: { halign: 'right', fontStyle: 'bold' }, 1: { halign: 'right' } },
              tableWidth: 'wrap', margin: { left: 140 }
            });

            const totalsFinalY = (doc as any).lastAutoTable.finalY;
            doc.setLineWidth(0.5).line(140, totalsFinalY + 2, 196, totalsFinalY + 2);
            doc.setFontSize(14).setFont('helvetica','bold');
            doc.text('Total:', 140, totalsFinalY + 8, { align:'right' });
            doc.text(formatCurrency(order.total), 196, totalsFinalY + 8, { align:'right' });

            doc.save(`pedido_ORD${String(order.id).padStart(4, '0')}.pdf`);
            toast({ title: '¡Éxito!', description: 'El PDF del pedido se ha descargado.', variant: 'success' });
        } catch (err) {
            console.error(err);
            toast({ title: 'Error', description: 'No se pudo generar el PDF.', variant: 'destructive' });
        } finally {
            setIsDownloadingPdf(false);
        }
    };
      
    const handleDownloadCustomPhoto = (url: string, filename: string) => {
        fetch(url)
            .then(res => res.blob())
            .then(blob => {
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            })
            .catch(() => toast({ variant: 'destructive', title: 'Error', description: 'No se pudo descargar la imagen.'}));
    }

    return (
        <Dialog onOpenChange={(open) => open && fetchOrderDetails()}>
            <DialogTrigger asChild>
                {trigger}
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="font-headline text-2xl">
                        Detalles del Pedido: ORD${String(orderId).padStart(4, '0')}
                    </DialogTitle>
                </DialogHeader>
                {isLoading ? <LoadingSpinner /> : order ? (
                    <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h4 className="font-semibold mb-2">Detalles del Cliente</h4>
                                <p className="text-sm text-muted-foreground"><strong>Cliente:</strong> {order.customerName}</p>
                                <p className="text-sm text-muted-foreground"><strong>Email:</strong> {order.customerEmail}</p>
                                {order.customerPhone && <p className="text-sm text-muted-foreground"><strong>Teléfono:</strong> {order.customerPhone}</p>}
                                <p className="text-sm text-muted-foreground"><strong>Dirección:</strong> {order.shippingAddress}</p>
                            </div>
                            <div className="bg-muted/50 p-4 rounded-lg">
                                <h4 className="font-semibold mb-2">Detalles de Entrega</h4>
                                <div className="flex items-center gap-4">
                                     <Avatar className="h-14 w-14 border">
                                        <AvatarImage src={(order as any).deliveryDriverProfilePic} alt={order.deliveryDriverName || 'Repartidor'} />
                                        <AvatarFallback>{order.deliveryDriverName ? order.deliveryDriverName.charAt(0) : '?'}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-bold">{order.recipientName || 'N/A'}</p>
                                        <Badge variant="outline" className={`capitalize ${statusStyles[order.status]}`}>{statusTranslations[order.status]}</Badge>
                                    </div>
                                </div>
                                <div className="text-sm text-muted-foreground mt-2 space-y-1">
                                    <p><strong>Tel. Recibe:</strong> {order.recipientPhone || 'N/A'}</p>
                                    <p className="font-bold text-primary"><strong>Fecha:</strong> {format(parseISO(order.delivery_date), 'PPP', { locale: es })}</p>
                                    <p className="font-bold text-primary"><strong>Horario:</strong> {formatTimeSlotForUI(order.delivery_time_slot)}</p>
                                    <p><strong>Firma:</strong> {order.is_anonymous ? 'Anónimo' : (order.signature || 'N/A')}</p>
                                    {order.dedication && <p><strong>Dedicatoria:</strong> {order.dedication}</p>}
                                </div>
                            </div>
                        </div>

                        <Separator />
                        <div>
                            <h4 className="font-semibold mb-2">Artículos</h4>
                            <ul className="space-y-2">
                                {order.items?.map((item, i) => (
                                    <li key={i} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                                        <div className="flex items-center gap-4">
                                            <div className="relative h-12 w-12 flex-shrink-0">
                                                <Image src={item.image || 'https://placehold.co/50x50.png'} alt={item.product_name || 'Artículo'} width={50} height={50} className="rounded-md" />
                                                {item.customPhotoUrl && (
                                                    <div className="absolute -bottom-1 -right-1 bg-primary rounded-full p-0.5"><ImageIcon className="w-3 h-3 text-white"/></div>
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-medium">{item.product_name}{item.variant_name ? ` (${item.variant_name})` : ''}</p>
                                                <p className="text-sm text-muted-foreground">Cantidad: {item.quantity}</p>
                                            </div>
                                        </div>
                                        <p className="font-medium">{formatCurrency(item.price * item.quantity)}</p>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {order.items?.some(item => item.customPhotoUrl) && (
                            <>
                            <Separator />
                            <div>
                                <h4 className="font-semibold mb-2">Fotos Personalizadas</h4>
                                {order.items.filter(item => item.customPhotoUrl).map((item, index) => (
                                    <div key={index} className="flex items-center gap-4 p-2 rounded-md bg-muted/50 mt-2">
                                        <Image src={item.customPhotoUrl!} alt={`Foto para ${item.product_name}`} width={60} height={60} className="rounded-md" />
                                        <div className="flex-1">
                                            <p className="text-sm font-medium">Para: {item.product_name}</p>
                                        </div>
                                        <Button variant="outline" size="sm" onClick={() => handleDownloadCustomPhoto(item.customPhotoUrl!, `foto_${orderId}_${item.product_id}.webp`)}>
                                            <Download className="mr-2 h-4 w-4"/>
                                            Descargar
                                        </Button>
                                    </div>
                                ))}
                            </div>
                            </>
                        )}


                        <Separator />
                         <div className="space-y-2 text-right">
                            <p>Subtotal: <strong>{formatCurrency(order.subtotal)}</strong></p>
                            {order.coupon_discount && order.coupon_discount > 0 && <p className="text-green-600">Descuento: -{formatCurrency(order.coupon_discount)}</p>}
                            <p>Envío: <strong>{formatCurrency(order.shipping_cost || 0)}</strong></p>
                            <p className="font-bold text-xl">Total: <strong>{formatCurrency(order.total)}</strong></p>
                        </div>

                         {(order.deliveryDriverName || order.delivery_notes || order.delivered_at) && <Separator />}
                        
                        {(order.deliveryDriverName || order.delivery_notes || order.delivered_at) && (
                             <div>
                                <h4 className="font-semibold mb-2 text-primary">Información del Reparto</h4>
                                <div className="text-sm text-muted-foreground space-y-2 bg-muted/50 p-3 rounded-md">
                                    {order.deliveryDriverName && <p className="flex items-center gap-2"><Truck className="w-4 h-4" /><strong>Repartidor:</strong> {order.deliveryDriverName}</p>}
                                    {order.delivered_at && <p className="flex items-center gap-2"><CalendarIcon className="w-4 h-4" /><strong>Entregado:</strong> {format(new Date(order.delivered_at), 'Pp', { locale: es })}</p>}
                                    {order.delivery_notes && <p className="flex items-start gap-2"><MessageSquare className="w-4 h-4 mt-1 flex-shrink-0" /><span><strong>Notas:</strong> {order.delivery_notes}</span></p>}
                                </div>
                            </div>
                        )}
                       

                    </div>
                ) : <p>No se encontraron detalles del pedido.</p>}
                <DialogFooter>
                    <Button variant="outline" onClick={handleDownloadPdf} loading={isDownloadingPdf} disabled={!order || isLoading}>
                        <Download className="mr-2 h-4 w-4" />
                        Descargar PDF
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
