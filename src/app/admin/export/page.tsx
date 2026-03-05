// src/app/admin/export/page.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function ExportPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Exportar Datos</h2>
      </div>
      <Card className="border-dashed border-2 border-muted/40 bg-muted/5">
        <CardHeader>
          <CardTitle>Módulo en preparación</CardTitle>
          <CardDescription>
            Esta sección se conectará a los servicios reales de exportación cuando completes los ajustes pendientes en backend.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            Por ahora mantenemos la pantalla sin información para evitar mostrar datos mock. Una vez que definamos los endpoints
            finales, aquí podrás lanzar descargas directas desde la base de datos.
          </p>
          <p>
            Si necesitas validar algo en el intermedio, podemos activar el módulo de inmediato en cuanto confirmes la fuente de
            datos definitiva.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
