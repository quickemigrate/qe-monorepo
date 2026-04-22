import { Router, Request, Response } from 'express';
import { Resend } from 'resend';
import { db } from '../firebase';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { nombre, email, pais, interes, mensaje } = req.body;

  if (!nombre || !email || !mensaje) {
    return res.status(400).json({ error: 'Faltan campos obligatorios.' });
  }

  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Quick Emigrate <hola@quickemigrate.com>',
      to: process.env.CONTACT_EMAIL || '',
      subject: `Nuevo contacto de ${nombre} (${pais || 'país no indicado'})`,
      html: `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#F3F3F4;font-family:Arial,Helvetica,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F3F3F4;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(26,28,28,0.08);">

          <!-- HEADER -->
          <tr>
            <td style="background-color:#1A1C1C;padding:32px 40px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align:middle;">
                    <span style="color:#ffffff;font-size:20px;font-weight:800;letter-spacing:-0.5px;">Quick Emigrate</span>
                  </td>
                </tr>
              </table>
              <p style="color:rgba(255,255,255,0.5);font-size:13px;margin:16px 0 0 0;letter-spacing:0.5px;text-transform:uppercase;">Nuevo mensaje de contacto</p>
            </td>
          </tr>

          <!-- ALERTA VERDE -->
          <tr>
            <td style="background-color:#25D366;padding:14px 40px;">
              <p style="margin:0;color:#ffffff;font-size:14px;font-weight:700;">
                ✓ Formulario recibido — responde en menos de 24h
              </p>
            </td>
          </tr>

          <!-- CUERPO -->
          <tr>
            <td style="padding:40px;">

              <!-- Nombre -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="border-bottom:1px solid #F3F3F4;padding-bottom:20px;">
                    <p style="margin:0 0 4px 0;font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:1px;">Nombre</p>
                    <p style="margin:0;font-size:17px;font-weight:700;color:#1A1C1C;">${nombre}</p>
                  </td>
                </tr>
              </table>

              <!-- Email -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="border-bottom:1px solid #F3F3F4;padding-bottom:20px;">
                    <p style="margin:0 0 4px 0;font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:1px;">Email</p>
                    <a href="mailto:${email}" style="font-size:17px;font-weight:700;color:#25D366;text-decoration:none;">${email}</a>
                  </td>
                </tr>
              </table>

              <!-- País -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="border-bottom:1px solid #F3F3F4;padding-bottom:20px;">
                    <p style="margin:0 0 4px 0;font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:1px;">País de origen</p>
                    <p style="margin:0;font-size:17px;font-weight:700;color:#1A1C1C;">${pais || 'No indicado'}</p>
                  </td>
                </tr>
              </table>

              <!-- Interés -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="border-bottom:1px solid #F3F3F4;padding-bottom:20px;">
                    <p style="margin:0 0 4px 0;font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:1px;">Interés principal</p>
                    <p style="margin:0;font-size:17px;font-weight:700;color:#1A1C1C;">${interes}</p>
                  </td>
                </tr>
              </table>

              <!-- Mensaje -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <p style="margin:0 0 8px 0;font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:1px;">Mensaje</p>
                    <div style="background-color:#F3F3F4;border-radius:10px;padding:20px;">
                      <p style="margin:0;font-size:15px;color:#1A1C1C;line-height:1.7;">${mensaje}</p>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:32px;">
                <tr>
                  <td align="center">
                    <a href="mailto:${email}" style="display:inline-block;background-color:#25D366;color:#ffffff;font-size:15px;font-weight:800;padding:14px 32px;border-radius:100px;text-decoration:none;">
                      Responder a ${nombre}
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background-color:#1A1C1C;padding:24px 40px;text-align:center;">
              <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.3);">© 2025 Quick Emigrate — Mensaje generado automáticamente</p>
              <p style="margin:8px 0 0 0;font-size:12px;color:rgba(255,255,255,0.2);">Tu ruta hacia España, clara y guiada.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>
`
    });

    await db.collection('leads').add({
      nombre,
      email,
      pais: pais || '',
      interes,
      mensaje,
      estado: 'nuevo',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Error enviando email:', error);
    res.status(500).json({ error: 'Error al enviar el mensaje.' });
  }
});

export default router;
