// src/lib/email.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.EMAIL_FROM ?? 'Florarte <no-reply@florarte.mx>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:9002';

export async function sendVerificationEmail(to: string, token: string) {
  const verifyUrl = `${APP_URL}/verify-email?token=${token}`;

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: 'Verifica tu correo electrónico — Florarte',
    html: `
      <!DOCTYPE html>
      <html lang="es">
      <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
      <body style="margin:0;padding:0;background-color:#f9f9f9;font-family:'Helvetica Neue',Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f9f9;padding:40px 0;">
          <tr>
            <td align="center">
              <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07);">
                <tr>
                  <td style="background:#c084ab;padding:32px 40px;text-align:center;">
                    <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;letter-spacing:-0.5px;">Florarte</h1>
                    <p style="margin:4px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">flores con amor</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:40px;">
                    <h2 style="margin:0 0 12px;color:#1a1a1a;font-size:22px;font-weight:700;">Confirma tu correo electrónico</h2>
                    <p style="margin:0 0 24px;color:#555;font-size:15px;line-height:1.6;">
                      ¡Bienvenido a Florarte! Haz clic en el botón de abajo para verificar tu correo y activar tu cuenta.
                      Este enlace es válido por <strong>24 horas</strong>.
                    </p>
                    <table cellpadding="0" cellspacing="0" style="margin:0 auto 32px;">
                      <tr>
                        <td style="background:#c084ab;border-radius:14px;">
                          <a href="${verifyUrl}" style="display:inline-block;padding:16px 36px;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;border-radius:14px;">
                            Verificar Correo
                          </a>
                        </td>
                      </tr>
                    </table>
                    <p style="margin:0 0 8px;color:#888;font-size:13px;">
                      Si no creaste una cuenta, puedes ignorar este correo.
                    </p>
                    <p style="margin:0;color:#bbb;font-size:12px;word-break:break-all;">
                      O copia este enlace: ${verifyUrl}
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="background:#f5f5f5;padding:20px 40px;text-align:center;border-top:1px solid #efefef;">
                    <p style="margin:0;color:#aaa;font-size:12px;">
                      © ${new Date().getFullYear()} Florarte · Este es un correo automático, no respondas a este mensaje.
                    </p>
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
  const resetUrl = `${APP_URL}/reset-password?token=${token}`;

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: 'Restablece tu contraseña — Florarte',
    html: `
      <!DOCTYPE html>
      <html lang="es">
      <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
      <body style="margin:0;padding:0;background-color:#f9f9f9;font-family:'Helvetica Neue',Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f9f9;padding:40px 0;">
          <tr>
            <td align="center">
              <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07);">
                <!-- Header -->
                <tr>
                  <td style="background:#c084ab;padding:32px 40px;text-align:center;">
                    <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;letter-spacing:-0.5px;">Florarte</h1>
                    <p style="margin:4px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">flores con amor</p>
                  </td>
                </tr>
                <!-- Body -->
                <tr>
                  <td style="padding:40px;">
                    <h2 style="margin:0 0 12px;color:#1a1a1a;font-size:22px;font-weight:700;">Restablece tu contraseña</h2>
                    <p style="margin:0 0 24px;color:#555;font-size:15px;line-height:1.6;">
                      Recibimos una solicitud para restablecer la contraseña de tu cuenta.
                      Haz clic en el botón de abajo para continuar. Este enlace es válido por <strong>1 hora</strong>.
                    </p>
                    <table cellpadding="0" cellspacing="0" style="margin:0 auto 32px;">
                      <tr>
                        <td style="background:#c084ab;border-radius:14px;">
                          <a href="${resetUrl}" style="display:inline-block;padding:16px 36px;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;border-radius:14px;">
                            Restablecer Contraseña
                          </a>
                        </td>
                      </tr>
                    </table>
                    <p style="margin:0 0 8px;color:#888;font-size:13px;">
                      Si no solicitaste esto, puedes ignorar este correo. Tu contraseña no cambiará.
                    </p>
                    <p style="margin:0;color:#bbb;font-size:12px;word-break:break-all;">
                      O copia este enlace: ${resetUrl}
                    </p>
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="background:#f5f5f5;padding:20px 40px;text-align:center;border-top:1px solid #efefef;">
                    <p style="margin:0;color:#aaa;font-size:12px;">
                      © ${new Date().getFullYear()} Florarte · Este es un correo automático, no respondas a este mensaje.
                    </p>
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
