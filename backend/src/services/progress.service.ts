import { feedbackRepository } from '../repositories/feedback.repository';
import { generateProgressInsight } from './ai.service';

const DAYS_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

function calculateStreak(feedbacks: { date: Date }[]): number {
  if (feedbacks.length === 0) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const uniqueDays = [
    ...new Set(
      feedbacks.map(f => {
        const d = new Date(f.date);
        d.setHours(0, 0, 0, 0);
        return d.getTime();
      }),
    ),
  ].sort((a, b) => b - a);

  const yesterday = today.getTime() - 86_400_000;
  if (uniqueDays[0] !== today.getTime() && uniqueDays[0] !== yesterday) return 0;

  let streak = 1;
  for (let i = 1; i < uniqueDays.length; i++) {
    if (uniqueDays[i] === uniqueDays[i - 1] - 86_400_000) streak++;
    else break;
  }
  return streak;
}

function getWeeklyCompleted(feedbacks: { date: Date }[]): number {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  monday.setHours(0, 0, 0, 0);
  return feedbacks.filter(f => new Date(f.date) >= monday).length;
}

function getAdherenceByDay(feedbacks: { date: Date }[]) {
  const days: { day: string; date: string; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const next = new Date(d.getTime() + 86_400_000);
    const count = feedbacks.filter(f => {
      const fd = new Date(f.date);
      return fd >= d && fd < next;
    }).length;
    days.push({ day: DAYS_ES[d.getDay()], date: d.toISOString().split('T')[0], count });
  }
  return days;
}

export const progressService = {
  async computeForPatient(patientId: string) {
    const feedbacks = await feedbackRepository.findByPatientId(patientId);
    const sorted = [...feedbacks].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    const streak          = calculateStreak(feedbacks);
    const weeklyCompleted = getWeeklyCompleted(feedbacks);
    const adherenceByDay  = getAdherenceByDay(feedbacks);

    const recent = sorted.slice(0, 7);
    const avgPain = recent.length
      ? Math.round((recent.reduce((s, f) => s + f.painLevel, 0) / recent.length) * 10) / 10
      : null;

    // AI insight — no bloquea si Ollama no está disponible
    const aiInsight = await generateProgressInsight(
      streak,
      weeklyCompleted,
      sorted.slice(0, 5).map(f => ({ painLevel: f.painLevel, emotionalState: f.emotionalState })),
    );

    return {
      streak,
      weeklyGoal:     { completed: weeklyCompleted, target: 5 },
      adherenceByDay,
      avgPain,
      totalCompleted: feedbacks.length,
      aiInsight:      aiInsight || null,
    };
  },
};
