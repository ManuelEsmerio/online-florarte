

import type { Coupon } from '../coupon-data';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface TemplateProps {
  userName: string;
  coupon: Coupon;
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
};

export const renderCouponAssignmentTemplate = ({ userName, coupon }: TemplateProps): string => {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://floreriaflorarte.com';

  const discountText = coupon.discount_type === 'percentage'
    ? `${coupon.discount_value}% de descuento`
    : `${formatCurrency(coupon.discount_value)} de descuento`;
  
  const usageText = coupon.max_uses
    ? `Uso: ${coupon.uses_count + 1} de ${coupon.max_uses}`
    : 'Usos ilimitados';

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>¡Tienes un nuevo cupón!</title>
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; background-color: #fce4ec; color: #333; }
    .container { max-width: 600px; margin: 40px auto; background-color: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
    .header { background-color: #f472b6; padding: 20px; text-align: center; }
    .header img { max-width: 150px; }
    .content { padding: 30px; text-align: center; line-height: 1.6; }
    .content h1 { color: #333; font-size: 24px; }
    .content p { font-size: 16px; color: #555; }
    .coupon-card { border-top: 2px dashed #f472b6; border-bottom: 2px dashed #f472b6; padding: 20px; margin: 30px auto; text-align: center; background-color: #fff9fb; border-radius: 8px; max-width: 350px; }
    .coupon-code { font-size: 28px; font-weight: bold; color: #d81b60; letter-spacing: 2px; margin: 10px 0; background-color: #fde4ec; padding: 10px; border-radius: 4px; display: inline-block;}
    .coupon-description { font-size: 18px; color: #333; margin-bottom: 10px; }
    .coupon-details { font-size: 14px; color: #555; margin-top: 15px; }
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
      <h1>¡Hola, ${userName}!</h1>
      <p>Gracias por tu fidelidad. Como agradecimiento, te hemos regalado un cupón de descuento para tu próxima compra.</p>
      
      <div class="coupon-card">
        <p class="coupon-description">${discountText}</p>
        <p>Tu código de cupón es:</p>
        <p class="coupon-code">${coupon.code}</p>
        <div class="coupon-details">
            <span>Válido hasta el: <strong>${format(new Date(coupon.valid_until), 'PPP', { locale: es })}</strong></span>
            <br>
            <span>${usageText}</span>
        </div>
      </div>

      <div class="button-container">
        <a href="${siteUrl}/products/all" class="button">Usar mi cupón ahora</a>
      </div>
      
      <p style="font-size: 12px; color: #888;">Aplican restricciones. Cupón válido para una sola compra.</p>
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
