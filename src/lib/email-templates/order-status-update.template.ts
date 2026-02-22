

import { Order, OrderStatus } from "../order-data";

interface TemplateProps {
  userName: string;
  order: Order;
  newStatus: OrderStatus;
}

const statusDetails: Record<OrderStatus, { title: string; message: string; icon: string }> = {
    pending: { title: '', message: '', icon: ''}, // Not used for updates
    processing: {
        title: "Tu pedido está en preparación",
        message: "Hemos comenzado a preparar tu hermoso arreglo floral. Nuestro equipo de floristas está trabajando con esmero para asegurarse de que cada detalle sea perfecto. Te notificaremos tan pronto como salga a ruta.",
        icon: "https://ci3.googleusercontent.com/meips/ADKq_NZf0eUe4YpSgO3a8x1g-1mJz3a4pSjQ3k_r_v-c4k6a8aZ_Cg=s0-d-e1-ft#https://api.useanimations.com/1297-loading-circle.gif"
    },
    shipped: {
        title: "¡Tu pedido está en camino!",
        message: "¡Buenas noticias! Tu pedido ha salido de nuestro taller y ya está en ruta hacia su destino. Nuestro repartidor hará todo lo posible por entregarlo dentro del horario seleccionado.",
        icon: "https://ci3.googleusercontent.com/meips/ADKq_NaG3A6w1b5XgZJ1s_V8g9j-2c6c9y_p_pQ-9v=s0-d-e1-ft#https://api.useanimations.com/1307-truck.gif"
    },
    delivered: {
        title: "Tu pedido ha sido entregado",
        message: "¡Misión cumplida! Tu arreglo ha sido entregado exitosamente. Esperamos que traiga mucha alegría. Gracias por confiar en Florarte para tus momentos especiales.",
        icon: "https://ci3.googleusercontent.com/meips/ADKq_NYo3R5d_a_xGz_K_N-2B_a_kQ-2_b_vC_xG_Z=s0-d-e1-ft#https://api.useanimations.com/1298-check-circle.gif"
    },
    cancelled: {
        title: "Tu pedido ha sido cancelado",
        message: "Hemos procesado la cancelación de tu pedido. Si corresponde, el reembolso se verá reflejado en tu método de pago original en los próximos días hábiles. Lamentamos cualquier inconveniente.",
        icon: "https://ci3.googleusercontent.com/meips/ADKq_NYo3R5d_a_xGz_K_N-2B_a_kQ-2_b_vC_xG_Z=s0-d-e1-ft#https://api.useanimations.com/1301-cross-circle.gif"
    },
};


export const renderOrderStatusUpdateTemplate = ({ userName, order, newStatus }: TemplateProps): string => {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://floreriaflorarte.com';
  const details = statusDetails[newStatus];

  if (!details) return '';

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Actualización de tu Pedido</title>
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; background-color: #fce4ec; color: #333; }
    .container { max-width: 600px; margin: 40px auto; background-color: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
    .header { background-color: #f472b6; padding: 20px; text-align: center; }
    .header img { max-width: 150px; }
    .content { padding: 30px; text-align: center; line-height: 1.6; }
    .icon-container { margin-bottom: 20px; }
    .icon-container img { width: 80px; height: 80px; }
    .content h1 { color: #333; font-size: 24px; }
    .content p { font-size: 16px; color: #555; }
    .button-container { text-align: center; margin-top: 30px; }
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
      <div class="icon-container">
        <img src="${details.icon}" alt="Icono de estado">
      </div>
      <h1>${details.title}</h1>
      <p>Hola, ${userName}. Queremos informarte sobre una actualización en tu pedido <strong>ORD${String(order.id).padStart(4, '0')}</strong>.</p>
      <p>${details.message}</p>
      
      <div class="button-container">
        <a href="${siteUrl}/orders" class="button">Ver Detalles de mi Pedido</a>
      </div>
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
