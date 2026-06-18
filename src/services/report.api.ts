import { api } from './api';

async function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export const reportApi = {
  async downloadPatientProgress(patientId: string, opts?: { from?: string; to?: string }) {
    const query = new URLSearchParams();
    if (opts?.from) query.set('from', opts.from);
    if (opts?.to) query.set('to', opts.to);
    const qs = query.toString();
    const blob = await api.getBlob(`/pacientes/${patientId}/reporte${qs ? `?${qs}` : ''}`);
    await downloadBlob(blob, `reporte-progreso-${patientId}.pdf`);
  },

  async downloadOwnProgress(opts?: { from?: string; to?: string }) {
    const query = new URLSearchParams();
    if (opts?.from) query.set('from', opts.from);
    if (opts?.to) query.set('to', opts.to);
    const qs = query.toString();
    const blob = await api.getBlob(`/me/reporte${qs ? `?${qs}` : ''}`);
    await downloadBlob(blob, 'mi-reporte-progreso.pdf');
  },
};
