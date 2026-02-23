// src/components/admin/orders/OrderActionsCell.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  MoreHorizontal,
  PenSquare,
  Loader2,
  Send,
  AlertTriangle,
  Truck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Order, OrderStatus } from '@/lib/definitions';
import { getCancellationInfo } from '@/lib/business-logic/order-logic';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { User as DeliveryUser } from '@/lib/definitions';
import { OrderDetailsDialog } from './OrderDetailsDialog';
import type { OrderColumnsProps } from '@/app/admin/orders/columns';

const availableTransitions: { [key in OrderStatus]?: OrderStatus[] } = {
  pendiente: ['procesando', 'cancelado'],
  procesando: ['enviado', 'cancelado'],
  enviado: ['completado'],
};

const statusTranslations: { [key in OrderStatus]: string } = {
  pendiente: 'Pendiente',
  procesando: 'En Proceso',
  enviado: 'Enviado',
  completado: 'Completado',
  cancelado: 'Cancelado',
};

export const OrderActionsCell = ({
  row,
  onUpdateStatus,
  onCancelOrder,
  deliveryDrivers,
  onSendUpdate,
  isSendingUpdateFor,
}: { row: any } & OrderColumnsProps) => {
  const order = row.original as Order;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<OrderStatus>(order.status);
  const [deliveryDriverId, setDeliveryDriverId] = useState<string | undefined>(
    order.delivery_driver_id?.toString() || undefined
  );
  const [deliveryNotes, setDeliveryNotes] = useState<string>(
    order.delivery_notes || ''
  );
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { canCancel, message: cancelMessage } = getCancellationInfo(order);
  const isActionable =
    order.status !== 'completado' && order.status !== 'cancelado';
  const possibleNextStatuses = availableTransitions[order.status] || [];
  const isSendingUpdate = isSendingUpdateFor === order.id;

  useEffect(() => {
    if (isEditOpen) {
      setNewStatus(order.status);
      setDeliveryDriverId(order.delivery_driver_id?.toString() || undefined);
      setDeliveryNotes(order.delivery_notes || '');
    }
  }, [isEditOpen, order]);

  const handleStatusUpdate = async () => {
    setIsSaving(true);
    const payload: { deliveryDriverId?: number; deliveryNotes?: string } = {};

    if (newStatus === 'enviado') {
      if (deliveryDriverId) {
        payload.deliveryDriverId = Number(deliveryDriverId);
      }
      if (deliveryNotes) {
        payload.deliveryNotes = deliveryNotes;
      }
    }

    await onUpdateStatus(order.id, newStatus, payload);
    setIsSaving(false);
    setIsEditOpen(false);
  };

  const handleSendUpdate = () => {
    onSendUpdate(order);
  };

  const getStatusAlert = (status: OrderStatus) => {
    switch (status) {
      case 'procesando':
        return (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Atención</AlertTitle>
            <AlertDescription>
              Valida que el pago se refleje correctamente. Al guardar, se
              notificará al cliente que su pedido está en preparación.
            </AlertDescription>
          </Alert>
        );
      case 'enviado':
        return (
          <Alert>
            <Truck className="h-4 w-4" />
            <AlertTitle>Notificación de Envío</AlertTitle>
            <AlertDescription>
              Se notificará al cliente que su pedido ha salido a ruta. Asigna un
              repartidor para el seguimiento.
            </AlertDescription>
          </Alert>
        );
      case 'completado':
        return (
          <Alert>
            <AlertTitle>Confirmación de Entrega</AlertTitle>
            <AlertDescription>
              Se notificará al cliente que su pedido fue completado.
            </AlertDescription>
          </Alert>
        );
      default:
        return null;
    }
  };

  const isSaveDisabled =
    isSaving ||
    (newStatus === 'enviado' && !deliveryDriverId) ||
    newStatus === order.status;

  return (
    <div className="text-right">
      <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost"
            className='h-8 w-8 p-0 hover:bg-primary/10 data-[state=active]:bg-primary/10 hover:text-primary data-[state=active]:text-primary'>
            <span className="sr-only">Abrir menú</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
          <OrderDetailsDialog
            orderId={order.id}
            trigger={
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                Ver Detalles
              </DropdownMenuItem>
            }
          />
          <Dialog open={isEditOpen} onOpenChange={(open) => setIsEditOpen(open)}>
            <DialogTrigger asChild>
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  setIsEditOpen(true);
                }}
                disabled={!isActionable}
              >
                <PenSquare className="mr-2 h-4 w-4" />
                Editar Estado
              </DropdownMenuItem>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="font-headline text-2xl">
                  Editar Pedido: ORD${String(order.id).padStart(4, '0')}
                </DialogTitle>
                <DialogDescription>
                  Selecciona el nuevo estado para el pedido.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="id-pedido" className="text-right">
                    ID Pedido
                  </Label>
                  <Input
                    id="id-pedido"
                    value={`ORD${String(order.id).padStart(4, '0')}`}
                    disabled
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="cliente" className="text-right">
                    Cliente
                  </Label>
                  <Input
                    id="cliente"
                    value={order.customerName}
                    disabled
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="status" className="text-right">
                    Estado
                  </Label>
                  <Select
                    value={newStatus}
                    onValueChange={(value: OrderStatus) => setNewStatus(value)}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Selecciona un estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={order.status} disabled>
                        {statusTranslations[order.status]} (Actual)
                      </SelectItem>
                      {possibleNextStatuses.map((status) => (
                        <SelectItem key={status} value={status}>
                          {statusTranslations[status]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {newStatus === 'enviado' && (
                  <>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="driver" className="text-right">
                        Repartidor
                      </Label>
                      <Select
                        value={deliveryDriverId}
                        onValueChange={setDeliveryDriverId}
                      >
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Asignar repartidor" />
                        </SelectTrigger>
                        <SelectContent>
                          {deliveryDrivers.map((driver) => (
                            <SelectItem
                              key={driver.id}
                              value={String(driver.id)}
                            >
                              {driver.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-4 items-start gap-4">
                      <Label
                        htmlFor="delivery-notes"
                        className="text-right pt-2"
                      >
                        Notas
                      </Label>
                      <Textarea
                        id="delivery-notes"
                        value={deliveryNotes}
                        onChange={(e) => setDeliveryNotes(e.target.value)}
                        placeholder="Ej: Se entregó por paquetería externa, guía #12345"
                        className="col-span-3"
                      />
                    </div>
                  </>
                )}
                <div className="mt-2">{getStatusAlert(newStatus)}</div>
              </div>
              <DialogFooter className="flex-col sm:flex-row sm:justify-between w-full space-y-2 sm:space-y-0">
                {isActionable && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" type="button" className="w-full sm:w-auto">
                        Cancelar Pedido
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Confirmar cancelación?</AlertDialogTitle>
                        <AlertDialogDescription>{cancelMessage}</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Volver</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => {
                            onCancelOrder(order.id);
                            setIsEditOpen(false);
                          }}
                          className="bg-destructive hover:bg-destructive/90"
                        >
                          Sí, cancelar pedido
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
                <div className="flex gap-2 w-full sm:w-auto justify-end">
                  <DialogClose asChild>
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={isSaving}
                      className="flex-1 sm:flex-initial"
                    >
                      Cerrar
                    </Button>
                  </DialogClose>
                  <Button
                    type="button"
                    onClick={handleStatusUpdate}
                    loading={isSaving}
                    disabled={isSaveDisabled}
                    className="flex-1 sm:flex-initial"
                  >
                    Guardar
                  </Button>
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <DropdownMenuItem onSelect={handleSendUpdate} disabled={isSendingUpdate}>
            {isSendingUpdate ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            {isSendingUpdate ? 'Enviando...' : 'Enviar actualización'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
