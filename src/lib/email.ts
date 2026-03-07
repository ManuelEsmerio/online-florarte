// src/lib/email.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.EMAIL_FROM ?? 'Florarte <no-reply@floreriaflorarte.com>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:9002';
const BRAND_LOGO_URL = `${APP_URL.replace(/\/$/, '')}/Logo_Flor.svg`;

export async function sendEmail(params: {
  to: string | string[];
  subject: string;
  html: string;
}) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[EMAIL] RESEND_API_KEY no configurada. Se omite envío.');
    return null;
  }

  return resend.emails.send({
    from: FROM_EMAIL,
    to: params.to,
    subject: params.subject,
    html: params.html,
  });
}

export async function sendVerificationEmail(to: string, token: string) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[EMAIL] RESEND_API_KEY no configurada. Se omite envío de verificación.');
    return null;
  }

  const verifyUrl = `${APP_URL}/verify-email?token=${token}`;
  const heroImageUrl = 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1200&q=80';

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: 'Verifica tu correo electrónico — Florarte',
    html: `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Public+Sans:wght@300;400;500;600;700&display=swap');
        </style>
      </head>
      <body style="margin:0;padding:0;background-color:#1a1a1a;font-family:'Public Sans','Segoe UI',Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#1a1a1a;padding:32px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 20px 50px rgba(0,0,0,0.35);">
                <tr>
                  <td align="center" style="padding:36px 24px 24px;background:#1a1a1a;">
                    <img src="${BRAND_LOGO_URL}" alt="Florarte" width="72" height="72" style="display:block;width:72px;height:72px;object-fit:contain;margin:0 auto 12px;" />
                    <p style="margin:0;font-size:18px;letter-spacing:0.3em;font-weight:600;color:#ffffff;text-transform:uppercase;">Florarte</p>
                  </td>
                </tr>
                <tr>
                  <td>
                    <img src="${heroImageUrl}" alt="Ramo elegante de rosas rosas y blancas" width="600" style="display:block;width:100%;height:auto;max-height:260px;object-fit:cover;" />
                  </td>
                </tr>
                <tr>
                  <td style="padding:48px 48px 32px;text-align:center;">
                    <h2 style="margin:0 0 16px;font-size:30px;line-height:1.2;color:#111111;">Confirma tu correo electrónico</h2>
                    <p style="margin:0 auto 28px;max-width:420px;font-size:16px;line-height:1.7;color:#4c4c4c;">
                      ¡Te damos una cálida bienvenida a Florarte! Para comenzar a disfrutar de nuestra colección exclusiva de flores y diseños personalizados, confirma tu cuenta haciendo clic en el botón.
                    </p>
                    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 32px;">
                      <tr>
                        <td style="border-radius:14px;background:#FF2D78;">
                          <a href="${verifyUrl}" style="display:inline-block;padding:18px 48px;font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:14px;letter-spacing:0.03em;">
                            Verificar Correo
                          </a>
                        </td>
                      </tr>
                    </table>
                    <p style="margin:0 0 8px;color:#6d6d6d;font-size:14px;">
                      El enlace permanecerá activo durante 24 horas. Si no realizaste este registro, ignora este mensaje.
                    </p>
                    <p style="margin:0;color:#9a9a9a;font-size:12px;word-break:break-all;">
                      También puedes copiar y pegar este enlace en tu navegador:<br />${verifyUrl}
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 48px 40px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #f1f1f1;padding-top:32px;text-align:center;">
                      <tr>
                        <td style="font-size:0;">
                          <a href="https://floreriaflorarte.com" style="display:inline-block;margin:0 8px;color:#b0b0b0;text-decoration:none;font-size:13px;">Sitio</a>
                          <a href="https://floreriaflorarte.com/privacy" style="display:inline-block;margin:0 8px;color:#b0b0b0;text-decoration:none;font-size:13px;">Privacidad</a>
                          <a href="https://floreriaflorarte.com/contacto" style="display:inline-block;margin:0 8px;color:#b0b0b0;text-decoration:none;font-size:13px;">Contacto</a>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-top:16px;color:#c5c5c5;font-size:11px;text-transform:uppercase;letter-spacing:0.2em;">
                          © ${new Date().getFullYear()} Florarte · Todos los derechos reservados
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-top:10px;color:#9a9a9a;font-size:11px;line-height:1.6;">
                          Recibiste este correo porque te registraste en Florarte. Agrega hola@floreriaflorarte.com a tus contactos para no perder nuestras novedades.
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  });
}

export async function sendPasswordResetEmail(to: string, token: string) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[EMAIL] RESEND_API_KEY no configurada. Se omite envío de reset de contraseña.');
    return null;
  }

  const resetUrl = `${APP_URL}/reset-password?token=${token}`;

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: 'Restablece tu contraseña — Florarte',
    html: `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;500;600;700&display=swap');
        </style>
      </head>
      <body style="margin:0;padding:0;background-color:#0b0b0f;font-family:'Public Sans','Segoe UI',Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#0b0b0f;padding:32px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;background:#ffffff;border-radius:26px;overflow:hidden;box-shadow:0 24px 60px rgba(2,6,23,0.6);">
                <tr>
                  <td align="center" style="padding:32px 24px;background:radial-gradient(circle at top,#1f1b24,#0b0b0f);">
                    <img src="${BRAND_LOGO_URL}" alt="Florarte" width="70" height="70" style="display:block;width:70px;height:70px;object-fit:contain;margin:0 auto 12px;" />
                    <p style="margin:0;font-size:17px;letter-spacing:0.28em;font-weight:600;color:#ffffff;text-transform:uppercase;">Florarte</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:44px 48px 40px;text-align:center;">
                    <div style="width:72px;height:72px;border-radius:20px;background:rgba(255,45,120,0.12);margin:0 auto 24px;display:flex;align-items:center;justify-content:center;color:#FF2D78;font-size:32px;font-weight:700;">🔒</div>
                    <h2 style="margin:0 0 12px;font-size:28px;color:#0f172a;">Restablece tu contraseña</h2>
                    <p style="margin:0 auto 28px;max-width:420px;color:#475467;font-size:15px;line-height:1.7;">
                      Recibimos una solicitud para actualizar tu contraseña. Para mantener tu cuenta segura, haz clic en el botón y sigue los pasos. El enlace caduca en <strong>1 hora</strong>.
                    </p>
                    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 28px;">
                      <tr>
                        <td style="border-radius:999px;background:#FF2D78;">
                          <a href="${resetUrl}" style="display:inline-block;padding:18px 46px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.05em;">
                            Restablecer Contraseña
                          </a>
                        </td>
                      </tr>
                    </table>
                    <p style="margin:0 0 8px;color:#98A2B3;font-size:13px;">Si no realizaste esta solicitud, puedes ignorar este correo.</p>
                    <p style="margin:0;color:#b3b8c2;font-size:12px;word-break:break-all;">Copiar enlace: ${resetUrl}</p>
                  </td>
                </tr>
                <tr>
                  <td style="background:#f7f7f9;padding:24px 40px;text-align:center;border-top:1px solid #eceef3;">
                    <p style="margin:0;color:#98a2b3;font-size:12px;">© ${new Date().getFullYear()} Florarte · Este es un correo automático, no respondas a este mensaje.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  });
}
