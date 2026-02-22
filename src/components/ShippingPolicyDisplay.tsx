// src/components/ShippingPolicyDisplay.tsx
import { Clock, CalendarDays, Zap, Phone, Mail } from 'lucide-react';
import Link from 'next/link';
import { Button } from './ui/button';

const PolicyItem = ({ icon, children }: { icon: React.ReactNode, children: React.ReactNode }) => (
    <div className="flex items-start gap-3">
        <div className="flex-shrink-0 text-primary pt-1">{icon}</div>
        <p className="text-xs text-muted-foreground">{children}</p>
    </div>
);

const ShippingPolicyDisplay = () => {
    return (
        <div className="space-y-3">
            <PolicyItem icon={<Zap className="h-4 w-4" />}>
                Envíos el mismo día para pedidos realizados antes de las 2:30 PM.
            </PolicyItem>
            <PolicyItem icon={<Clock className="h-4 w-4" />}>
                <strong>Horarios de entrega:</strong> L–S: 8:30 AM a 7:00 PM | D: 9:00 AM a 2:30 PM.
            </PolicyItem>
            <PolicyItem icon={<CalendarDays className="h-4 w-4" />}>
                En fechas especiales (ej. Día de las Madres), el horario es abierto de 8:30 AM a 7:00 PM.
            </PolicyItem>
            <PolicyItem icon={<Phone className="h-4 w-4" />}>
                Si el destinatario no se encuentra, contactaremos o dejaremos el arreglo con un vecino o compañero.
            </PolicyItem>
            <PolicyItem icon={<Mail className="h-4 w-4" />}>
                Recibirás todas las notificaciones del estado de tu pedido en tu correo electrónico.
            </PolicyItem>
             <div className="pt-2">
                <Button variant="link" asChild className="p-0 h-auto text-xs">
                    <Link href="/shipping-policy">Ver políticas completas</Link>
                </Button>
            </div>
        </div>
    );
};

export default ShippingPolicyDisplay;
