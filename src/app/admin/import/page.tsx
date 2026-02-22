// src/app/admin/import/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { ImportModal } from './import-modal';

export default function ImportPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Importar Datos</h2>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Carga Masiva de Datos</CardTitle>
          <CardDescription>
            Utiliza esta herramienta para importar grandes cantidades de datos a tu tienda de forma rápida y eficiente usando archivos CSV.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg">
            <Upload className="w-16 h-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">Selecciona "Carga Masiva" en el menú para comenzar.</p>
            <Button onClick={() => setIsModalOpen(true)}>Iniciar Carga Masiva</Button>
          </div>
        </CardContent>
      </Card>
      <ImportModal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </div>
  );
}
