import nodemailer from 'nodemailer';

let transporter: nodemailer.Transporter | null = null;

async function getTransporter() {
  if (transporter) return transporter;

  if (process.env.EMAIL_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT) || 587,
      secure: false,
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });
  } else {
    // Cuenta de prueba Ethereal — funciona sin config extra
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
    console.log('📧 Usando cuenta Ethereal de prueba:', testAccount.user);
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
    if (preview) console.log('📬 Vista previa del correo:', preview);

    return { messageId: info.messageId, preview: preview || null };
  },
};
