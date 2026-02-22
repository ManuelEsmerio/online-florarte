
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PackagesPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Apariencia</h2>
        </div>
        <Card>
            <CardHeader>
                <CardTitle>Próximamente</CardTitle>
            </CardHeader>
            <CardContent>
                <p>La gestión de la apariencia estará disponible aquí.</p>
            </CardContent>
        </Card>
    </div>
  );
}
