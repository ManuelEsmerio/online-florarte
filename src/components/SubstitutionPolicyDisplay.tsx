// src/components/SubstitutionPolicyDisplay.tsx
import Link from 'next/link';
import { Button } from './ui/button';
import { Flower2, Gift, Camera } from 'lucide-react';

const PolicyItem = ({ icon, children }: { icon: React.ReactNode, children: React.ReactNode }) => (
    <div className="flex items-start gap-3">
        <div className="flex-shrink-0 text-primary pt-1">{icon}</div>
        <p className="text-xs text-muted-foreground">{children}</p>
    </div>
);

const SubstitutionPolicyDisplay = () => {
    return (
        <div className="space-y-3">
            <PolicyItem icon={<Flower2 className="h-4 w-4" />}>
                <strong>Flores:</strong> Los arreglos pueden tener ligeras variaciones. Las sustituciones serán de igual o mayor valor y nunca afectarán a las flores principales sin tu autorización.
            </PolicyItem>
            <PolicyItem icon={<Gift className="h-4 w-4" />}>
                <strong>Globos y Peluches:</strong> Su duración y modelo pueden variar según el clima, manejo y existencia. Se sustituirán por uno de valor equivalente si es necesario.
            </PolicyItem>
            <PolicyItem icon={<Camera className="h-4 w-4" />}>
                <strong>Productos dañados:</strong> Podrán ser reembolsados si se presenta evidencia fotográfica dentro de las primeras 24 horas después de la entrega.
            </PolicyItem>
             <div className="pt-2">
                <Button variant="link" asChild className="p-0 h-auto text-xs">
                    <Link href="/shipping-policy">Ver políticas completas</Link>
                </Button>
            </div>
        </div>
    );
};

export default SubstitutionPolicyDisplay;
