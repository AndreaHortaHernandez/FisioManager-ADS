import PDFDocument from 'pdfkit';
import { userRepository } from '../repositories/user.repository';
import { feedbackRepository } from '../repositories/feedback.repository';
import { progressService } from './progress.service';
import { AppError } from '../errors/AppError';

const EMOTION_LABEL: Record<string, string> = {
  GREAT: 'Excelente', GOOD: 'Bien', OK: 'Regular', BAD: 'Mal', TERRIBLE: 'Terrible',
};

export const reportService = {

  async generatePatientProgressPdf(patientId: string, from?: string, to?: string): Promise<Buffer> {
    const patient = await userRepository.findById(patientId);
    if (!patient || patient.role !== 'PATIENT') throw new AppError('Paciente no encontrado', 404);

    const allFeedbacks = await feedbackRepository.findByPatientId(patientId);
    const fromDate = from ? new Date(from) : null;
    const toDate   = to   ? new Date(to)   : null;

    const feedbacks = allFeedbacks.filter(f => {
      const d = new Date(f.date);
      if (fromDate && d < fromDate) return false;
      if (toDate && d > toDate) return false;
      return true;
    });

    const progress = await progressService.computeForPatient(patientId);

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    const done = new Promise<Buffer>(resolve => doc.on('end', () => resolve(Buffer.concat(chunks))));

    doc.fontSize(20).fillColor('#5A67D8').text('FisioManager', { align: 'left' });
    doc.fontSize(12).fillColor('#666').text('Reporte de progreso del paciente');
    doc.moveDown();
    doc.fontSize(11).fillColor('#000');
    doc.text(`Paciente: ${patient.name}`);
    doc.text(`Condición: ${patient.patientProfile?.condition ?? '—'}`);
    if (fromDate || toDate) {
      doc.text(`Rango: ${fromDate?.toLocaleDateString('es-MX') ?? '—'} a ${toDate?.toLocaleDateString('es-MX') ?? 'hoy'}`);
    }
    doc.text(`Generado: ${new Date().toLocaleString('es-MX')}`);
    doc.moveDown();

    doc.fontSize(14).fillColor('#5A67D8').text('Resumen de progreso');
    doc.fontSize(11).fillColor('#000');
    doc.text(`Racha actual: ${progress.streak} día(s)`);
    doc.text(`Rutinas completadas (total): ${progress.totalCompleted}`);
    doc.text(`Meta semanal: ${progress.weeklyGoal.completed}/${progress.weeklyGoal.target}`);
    doc.text(`Dolor promedio (últimos reportes): ${progress.avgPain ?? '—'}`);
    doc.moveDown();

    doc.fontSize(14).fillColor('#5A67D8').text('Historial de feedback en el rango');
    doc.moveDown(0.5);
    if (feedbacks.length === 0) {
      doc.fontSize(11).fillColor('#666').text('Sin registros de feedback en el rango seleccionado.');
    } else {
      feedbacks.forEach(f => {
        doc.fontSize(10).fillColor('#000').text(
          `${new Date(f.date).toLocaleDateString('es-MX')} — Dolor: ${f.painLevel}/10 — Estado: ${EMOTION_LABEL[f.emotionalState] ?? f.emotionalState}`,
        );
        if (f.aiSummary) doc.fontSize(9).fillColor('#666').text(`  Resumen: ${f.aiSummary}`);
      });
    }

    doc.end();
    return done;
  },
};
