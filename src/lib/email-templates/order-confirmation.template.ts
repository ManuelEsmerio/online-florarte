

import { Order } from "../order-data";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface TemplateProps {
  userName: string;
  order: Order;
}

export const renderOrderConfirmationTemplate = ({ userName, order }: TemplateProps): string => {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://floreriaflorarte.com';

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
  };

  const itemsHtml = order.items?.map(item => `
    <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">
            <img src="cid:product_${item.product_id}@florarte.com" alt="${item.name}" width="60" style="border-radius: 4px; vertical-align: middle; margin-right: 10px;">
            ${item.name}
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(item.price)}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(item.price * item.quantity)}</td>
    </tr>
  `).join('') || '';

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmación de Pedido</title>
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; background-color: #fce4ec; color: #333; }
    .container { max-width: 600px; margin: 40px auto; background-color: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
    .header { background-color: #f472b6; padding: 20px; text-align: center; }
    .header img { max-width: 150px; }
    .content { padding: 30px; line-height: 1.6; }
    .content h1 { color: #333; font-size: 24px; }
    .content p { font-size: 16px; color: #555; }
    .order-details { margin: 30px 0; }
    .order-details h2 { font-size: 20px; color: #333; border-bottom: 2px solid #eee; padding-bottom: 10px; margin-bottom: 20px; }
    .order-table { width: 100%; border-collapse: collapse; }
    .order-table th { text-align: left; padding: 10px; background-color: #f8f9fa; border-bottom: 2px solid #eee; }
    .totals { margin-top: 20px; padding-top: 20px; border-top: 2px solid #eee; text-align: right; }
    .totals p { margin: 5px 0; font-size: 16px; }
    .totals p strong { color: #333; }
    .button-container { text-align: center; margin: 30px 0; }
    .button { background-color: #d81b60; color: #ffffff !important; padding: 15px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px; display: inline-block; }
    .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #888; }
    .footer a { color: #f472b6; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="cid:logo@florarte.com" alt="Florería Florarte Logo">
    </div>
    <div class="content">
      <h1>¡Gracias por tu compra, ${userName}!</h1>
      <p>Hemos recibido tu pedido y ya estamos trabajando en él. A continuación, encontrarás los detalles de tu compra.</p>
      
      <div class="order-details">
        <h2>Pedido ORD${String(order.id).padStart(4, '0')}</h2>
        <p><strong>Fecha del Pedido:</strong> ${format(new Date(order.created_at), 'PPP', { locale: es })}</p>
        <p><strong>Fecha de Entrega:</strong> ${format(new Date(order.delivery_date), 'PPP', { locale: es })}</p>
        <p><strong>Horario de Entrega:</strong> ${order.delivery_time_slot}</p>
        <p><strong>Dirección de Envío:</strong> ${order.shippingAddress}</p>
        
        <table class="order-table" style="margin-top: 20px;">
            <thead>
                <tr>
                    <th style="width: 50%;">Producto</th>
                    <th style="text-align: center;">Cant.</th>
                    <th style="text-align: right;">Precio</th>
                    <th style="text-align: right;">Subtotal</th>
                </tr>
            </thead>
            <tbody>
                ${itemsHtml}
            </tbody>
        </table>
        
        <div class="totals">
            <p>Subtotal: <strong>${formatCurrency(order.subtotal)}</strong></p>
            ${order.discount ? `<p>Descuento: <strong style="color: #22c55e;">-${formatCurrency(order.discount)}</strong></p>` : ''}
            <p>Envío: <strong>${formatCurrency(order.shipping_cost || 0)}</strong></p>
            <p style="font-size: 20px; font-weight: bold;">Total: <strong>${formatCurrency(order.total)}</strong></p>
        </div>
      </div>

      <div class="button-container">
        <a href="${siteUrl}/orders" class="button">Ver mis pedidos</a>
      </div>
      
      <p>Gracias por confiar en nosotros,<br>El equipo de Florería Florarte</p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Florería Florarte. Todos los derechos reservados.</p>
      <p><a href="${siteUrl}">${siteUrl}</a></p>
    </div>
  </div>
</body>
</html>
  `;
};
