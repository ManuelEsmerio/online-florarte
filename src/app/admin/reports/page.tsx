
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ReportsPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Reportes</h2>
        </div>
        <Card>
            <CardHeader>
                <CardTitle>Próximamente</CardTitle>
            </CardHeader>
            <CardContent>
                <p>La generación de reportes estará disponible aquí.</p>
            </CardContent>
        </Card>
    </div>
  );
}
