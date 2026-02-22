

import { Order } from "../order-data";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface TemplateProps {
  order: Order;
}

export const renderNewOrderNotificationTemplate = ({ order }: TemplateProps): string => {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://floreriaflorarte.com';
  const adminUrl = `${siteUrl}/admin/orders`;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
  };

  const itemsHtml = order.items?.map(item => `
    <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">
            <img src="cid:product_${item.product_id}@florarte.com" alt="${item.name}" width="60" style="border-radius: 4px; vertical-align: middle; margin-right: 10px;">
            ${item.name} (ID: ${item.product_id})
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(item.price * item.quantity)}</td>
    </tr>
  `).join('') || '';

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nuevo Pedido Recibido</title>
  <style>
    body { margin: 0; padding: 0; font-family: sans-serif; background-color: #f4f4f4; color: #333; }
    .container { max-width: 600px; margin: 40px auto; background-color: #fff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .header { background-color: #f472b6; color: white; padding: 20px; text-align: center; border-top-left-radius: 8px; border-top-right-radius: 8px; }
    .header img { max-width: 150px; }
    .content { padding: 30px; }
    .content h1 { font-size: 24px; color: #333; }
    .content p { font-size: 16px; color: #555; }
    .order-details { margin: 30px 0; }
    .order-details h2 { font-size: 20px; border-bottom: 2px solid #eee; padding-bottom: 10px; }
    .order-table { width: 100%; border-collapse: collapse; }
    .order-table th { text-align: left; padding: 10px; background-color: #f8f9fa; }
    .button-container { text-align: center; margin: 30px 0; }
    .button { background-color: #d81b60; color: #ffffff !important; padding: 15px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; }
    .footer { padding: 20px; text-align: center; font-size: 12px; color: #888; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>¡Nuevo Pedido!</h1>
    </div>
    <div class="content">
      <h1>Tienes un nuevo pedido: ORD${String(order.id).padStart(4, '0')}</h1>
      <p>Un nuevo pedido ha sido realizado en la tienda en línea. Revisa los detalles a continuación.</p>
      
      <div class="order-details">
        <h2>Detalles del Pedido</h2>
        <p><strong>Cliente:</strong> ${order.customerName} (${order.customerEmail})</p>
        <p><strong>Fecha de Entrega:</strong> ${format(new Date(order.delivery_date), 'PPP', { locale: es })} a las ${order.delivery_time_slot}</p>
        <p><strong>Dirección:</strong> ${order.shippingAddress}</p>
        <p><strong>Dedicatoria:</strong> ${order.dedication || 'N/A'}</p>
        <p><strong>Firma:</strong> ${order.is_anonymous ? 'Anónimo' : (order.signature || 'N/A')}</p>
        
        <table class="order-table" style="margin-top: 20px;">
            <thead>
                <tr>
                    <th style="width: 60%;">Producto</th>
                    <th style="text-align: center;">Cant.</th>
                    <th style="text-align: right;">Subtotal</th>
                </tr>
            </thead>
            <tbody>
                ${itemsHtml}
            </tbody>
        </table>
        
        <div style="text-align: right; margin-top: 20px;">
            <p>Subtotal: ${formatCurrency(order.subtotal)}</p>
            ${order.discount ? `<p style="color: #22c55e;">Descuento: -${formatCurrency(order.discount)}</p>` : ''}
            <p>Envío: ${formatCurrency(order.shipping_cost || 0)}</p>
            <p style="font-size: 20px; font-weight: bold;">Total: ${formatCurrency(order.total)}</p>
        </div>
      </div>

      <div class="button-container">
        <a href="${adminUrl}" class="button">Ir al Panel de Administrador</a>
      </div>
    </div>
    <div class="footer">
      <p>Esta es una notificación automática de Florería Florarte.</p>
    </div>
  </div>
</body>
</html>
  `;
};
