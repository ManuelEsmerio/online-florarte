
interface TemplateProps {
  userName: string;
  resetUrl: string;
}

export const renderPasswordResetTemplate = ({ userName, resetUrl }: TemplateProps): string => {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://floreriaflorarte.com';

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recuperación de Contraseña</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
      background-color: #fce4ec;
      color: #333;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background-color: #fff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 15px rgba(0,0,0,0.1);
    }
    .header {
      background-color: #f472b6;
      padding: 20px;
      text-align: center;
    }
    .header img {
      max-width: 150px;
    }
    .content {
      padding: 30px;
      line-height: 1.6;
    }
    .content h1 {
      color: #333;
      font-size: 24px;
    }
    .content p {
      font-size: 16px;
      color: #555;
    }
    .button-container {
      text-align: center;
      margin: 30px 0;
    }
    .button {
      background-color: #d81b60;
      color: #ffffff;
      padding: 15px 25px;
      text-decoration: none;
      border-radius: 5px;
      font-weight: bold;
      font-size: 16px;
      display: inline-block;
    }
    .footer {
      background-color: #f8f9fa;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #888;
    }
    .footer a {
      color: #f472b6;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="cid:logo@florarte.com" alt="Florería Florarte Logo">
    </div>
    <div class="content">
      <h1>Hola, ${userName}</h1>
      <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en Florería Florarte. Si no has sido tú, puedes ignorar este correo electrónico.</p>
      <p>Para continuar, haz clic en el siguiente botón:</p>
      <div class="button-container">
        <a href="${resetUrl}" class="button">Restablecer Contraseña</a>
      </div>
      <p>Este enlace de restablecimiento es válido por <strong>30 minutos</strong>.</p>
      <p>Si tienes problemas con el botón, copia y pega la siguiente URL en tu navegador:</p>
      <p><a href="${resetUrl}" style="word-break: break-all; color: #d81b60;">${resetUrl}</a></p>
      <p>Gracias,<br>El equipo de Florería Florarte</p>
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
