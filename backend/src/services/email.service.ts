import nodemailer from 'nodemailer';
import { logger } from '../lib/logger';

let transporter: nodemailer.Transporter | null = null;

async function getTransporter() {
  if (transporter) return transporter;

  if (process.env.EMAIL_HOST) {
    const port = Number(process.env.EMAIL_PORT) || 587;
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port,

      secure: port === 465,
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    try {
      await transporter.verify();
      logger.info('smtp_connected', { host: process.env.EMAIL_HOST, port, user: process.env.EMAIL_USER });
    } catch (err) {
      logger.error('smtp_connection_failed', { error: (err as Error).message });
    }
  } else {

    transporter = nodemailer.createTransport({ jsonTransport: true });
    logger.info('smtp_disabled', { hint: 'define EMAIL_HOST para activarlo' });
  }

  return transporter;
}

export const emailService = {
  async sendAppointmentReminder(opts: {
    patientName: string;
    patientEmail: string;
    therapistName: string;
    dateTime: Date;
    notes?: string;
  }) {
    const t = await getTransporter();
    const fechaFormateada = opts.dateTime.toLocaleString('es-MX', {
      weekday: 'long', year: 'numeric', month: 'long',
      day: 'numeric', hour: '2-digit', minute: '2-digit',
    });

    const info = await t.sendMail({
      from: `"FisioManager" <${process.env.EMAIL_FROM ?? 'noreply@fisiomanager.com'}>`,
      to: opts.patientEmail,
      subject: `Recordatorio de cita — ${fechaFormateada}`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; border-radius: 12px; border: 1px solid #e0e0e0;">
          <h2 style="color: #5A67D8; margin-bottom: 4px;">FisioManager</h2>
          <p style="color: #666; margin-top: 0;">Recordatorio de cita</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 16px 0;" />
          <p>Hola <strong>${opts.patientName}</strong>,</p>
          <p>Te recordamos que tienes una cita programada con:</p>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <tr><td style="padding: 8px; color: #666;">Terapeuta</td><td style="padding: 8px; font-weight: bold;">${opts.therapistName}</td></tr>
            <tr style="background:#f9f9f9;"><td style="padding: 8px; color: #666;">Fecha y hora</td><td style="padding: 8px; font-weight: bold;">${fechaFormateada}</td></tr>
            ${opts.notes ? `<tr><td style="padding: 8px; color: #666;">Notas</td><td style="padding: 8px;">${opts.notes}</td></tr>` : ''}
          </table>
          <p style="color: #888; font-size: 13px;">Si necesitas cancelar o reprogramar, comunícate con la clínica a la brevedad.</p>
        </div>
      `,
    });

    const preview = nodemailer.getTestMessageUrl(info);
    if (preview) logger.info('email_preview', { kind: 'appointment_reminder', preview });

    return { messageId: info.messageId, preview: preview || null };
  },

  async sendEmailVerification(opts: { name: string; email: string; verifyUrl: string }) {
    const t = await getTransporter();
    const info = await t.sendMail({
      from: `"FisioManager" <${process.env.EMAIL_FROM ?? 'noreply@fisiomanager.com'}>`,
      to: opts.email,
      subject: 'Verifica tu cuenta — FisioManager',
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; border-radius: 12px; border: 1px solid #e0e0e0;">
          <h2 style="color: #5A67D8; margin-bottom: 4px;">FisioManager</h2>
          <p style="color: #666; margin-top: 0;">Verificación de cuenta</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 16px 0;" />
          <p>Hola <strong>${opts.name}</strong>,</p>
          <p>¡Bienvenido/a! Confirma tu correo para activar tu cuenta (el enlace expira en 24 horas):</p>
          <p style="text-align:center; margin: 24px 0;">
            <a href="${opts.verifyUrl}" style="background:#5A67D8; color:#fff; padding:12px 24px; border-radius:8px; text-decoration:none; font-weight:bold;">Verificar mi cuenta</a>
          </p>
          <p style="color: #888; font-size: 13px;">Si no creaste esta cuenta, puedes ignorar este correo.</p>
        </div>
      `,
    });

    const preview = nodemailer.getTestMessageUrl(info);
    if (preview) logger.info('email_preview', { kind: 'email_verification', preview });
    return { messageId: info.messageId, preview: preview || null };
  },

  async sendPasswordRecovery(opts: { name: string; email: string; resetUrl: string; token: string }) {
    const t = await getTransporter();
    const info = await t.sendMail({
      from: `"FisioManager" <${process.env.EMAIL_FROM ?? 'noreply@fisiomanager.com'}>`,
      to: opts.email,
      subject: 'Recuperación de contraseña — FisioManager',
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; border-radius: 12px; border: 1px solid #e0e0e0;">
          <h2 style="color: #5A67D8; margin-bottom: 4px;">FisioManager</h2>
          <p style="color: #666; margin-top: 0;">Recuperación de contraseña</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 16px 0;" />
          <p>Hola <strong>${opts.name}</strong>,</p>
          <p>Recibimos una solicitud para restablecer tu contraseña. Haz clic en el botón para continuar (válido por 1 hora):</p>
          <p style="text-align:center; margin: 24px 0;">
            <a href="${opts.resetUrl}" style="background:#5A67D8; color:#fff; padding:12px 24px; border-radius:8px; text-decoration:none; font-weight:bold;">Restablecer contraseña</a>
          </p>
          <p style="color: #888; font-size: 13px;">Si no solicitaste este cambio, ignora este correo. Tu contraseña no cambiará.</p>
        </div>
      `,
    });

    const preview = nodemailer.getTestMessageUrl(info);
    if (preview) logger.info('email_preview', { kind: 'password_recovery', preview });
    return { messageId: info.messageId, preview: preview || null };
  },

  async sendHighPainAlert(opts: {
    therapistName: string;
    therapistEmail: string;
    patientName: string;
    painLevel: number;
    emotionalState: string;
  }) {
    const t = await getTransporter();
    const info = await t.sendMail({
      from: `"FisioManager" <${process.env.EMAIL_FROM ?? 'noreply@fisiomanager.com'}>`,
      to: opts.therapistEmail,
      subject: `⚠️ Alerta de dolor alto — ${opts.patientName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; border-radius: 12px; border: 1px solid #f0c0c0;">
          <h2 style="color: #c0392b; margin-bottom: 4px;">FisioManager</h2>
          <p style="color: #666; margin-top: 0;">Alerta clínica</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 16px 0;" />
          <p>Hola <strong>${opts.therapistName}</strong>,</p>
          <p>Tu paciente <strong>${opts.patientName}</strong> reportó un nivel de dolor elevado en su última sesión:</p>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <tr><td style="padding: 8px; color: #666;">Nivel de dolor</td><td style="padding: 8px; font-weight: bold; color:#c0392b;">${opts.painLevel}/10</td></tr>
            <tr style="background:#f9f9f9;"><td style="padding: 8px; color: #666;">Estado emocional</td><td style="padding: 8px; font-weight: bold;">${opts.emotionalState}</td></tr>
          </table>
          <p style="color: #888; font-size: 13px;">Te recomendamos revisar su progreso y considerar un seguimiento.</p>
        </div>
      `,
    });

    const preview = nodemailer.getTestMessageUrl(info);
    if (preview) logger.info('email_preview', { kind: 'high_pain_alert', preview });
    return { messageId: info.messageId, preview: preview || null };
  },

  async sendRoutineReminder(opts: {
    patientName: string;
    patientEmail: string;
    routineTitle: string;
  }) {
    const t = await getTransporter();
    const info = await t.sendMail({
      from: `"FisioManager" <${process.env.EMAIL_FROM ?? 'noreply@fisiomanager.com'}>`,
      to: opts.patientEmail,
      subject: `Recordatorio de rutina — ${opts.routineTitle}`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; border-radius: 12px; border: 1px solid #e0e0e0;">
          <h2 style="color: #5A67D8; margin-bottom: 4px;">FisioManager</h2>
          <p style="color: #666; margin-top: 0;">Recordatorio de rutina</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 16px 0;" />
          <p>Hola <strong>${opts.patientName}</strong>,</p>
          <p>Es momento de realizar tu rutina de hoy:</p>
          <p style="font-size: 18px; font-weight: bold; color:#5A67D8; margin: 16px 0;">${opts.routineTitle}</p>
          <p style="color: #888; font-size: 13px;">Ingresa a la app para comenzar tu sesión.</p>
        </div>
      `,
    });

    const preview = nodemailer.getTestMessageUrl(info);
    if (preview) logger.info('email_preview', { kind: 'routine_reminder', preview });
    return { messageId: info.messageId, preview: preview || null };
  },

  async sendRoutineAssigned(opts: {
    patientName: string;
    patientEmail: string;
    therapistName: string;
    routineTitle: string;
  }) {
    const t = await getTransporter();
    const info = await t.sendMail({
      from: `"FisioManager" <${process.env.EMAIL_FROM ?? 'noreply@fisiomanager.com'}>`,
      to: opts.patientEmail,
      subject: `Nueva rutina asignada — ${opts.routineTitle}`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; border-radius: 12px; border: 1px solid #e0e0e0;">
          <h2 style="color: #5A67D8; margin-bottom: 4px;">FisioManager</h2>
          <p style="color: #666; margin-top: 0;">Nueva rutina asignada</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 16px 0;" />
          <p>Hola <strong>${opts.patientName}</strong>,</p>
          <p>Tu terapeuta <strong>${opts.therapistName}</strong> te asignó una nueva rutina:</p>
          <p style="font-size: 18px; font-weight: bold; color:#5A67D8; margin: 16px 0;">${opts.routineTitle}</p>
          <p style="color: #888; font-size: 13px;">Ingresa a la app para comenzar tu sesión cuando estés listo.</p>
        </div>
      `,
    });

    const preview = nodemailer.getTestMessageUrl(info);
    if (preview) logger.info('email_preview', { kind: 'routine_assigned', preview });
    return { messageId: info.messageId, preview: preview || null };
  },
};
