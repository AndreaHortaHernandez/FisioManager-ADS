import { analyticsRepository } from '../repositories/analytics.repository';

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return Math.round((values.reduce((s, v) => s + v, 0) / values.length) * 1000) / 1000;
}

export const analyticsService = {

  async getClinicOverview() {
    const [activePatients, sessionsCompleted, finished] = await Promise.all([
      analyticsRepository.countActivePatients(),
      analyticsRepository.countFinishedSessions(),
      analyticsRepository.findFinishedSessionsWithPatient(),
    ]);

    const avgAdherence = average(finished.map(f => f.completionRate ?? 0));

    return { activePatients, sessionsCompleted, avgAdherence };
  },

  async getTherapistComparison() {
    const therapists = await analyticsRepository.findAllTherapists();

    return Promise.all(
      therapists.map(async t => {
        const patients = await analyticsRepository.findPatientIdsByTherapist(t.id);
        const patientIds = patients.map(p => p.userId);
        const sessions = patientIds.length
          ? await analyticsRepository.findFinishedSessionsForPatients(patientIds)
          : [];

        return {
          therapistId: t.id,
          therapistName: t.name,
          activePatients: patientIds.length,
          sessionsCompleted: sessions.length,
          avgAdherence: average(sessions.map(s => s.completionRate ?? 0)),
        };
      }),
    );
  },
};
