import { Request, Response } from 'express';
import { reportService } from '../services/report.service';
import { catchAsync } from '../utils/catchAsync';

export const getProgressReportPdf = catchAsync(async (req: Request, res: Response) => {
  const { from, to } = req.query as Record<string, string>;
  const patientId = req.user!.role === 'PATIENT' ? req.user!.id : req.params.id;
  const pdf = await reportService.generatePatientProgressPdf(patientId, from, to);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="reporte-progreso-${patientId}.pdf"`);
  res.send(pdf);
});
