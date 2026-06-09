import type { Patient, Routine, Feedback, ActivityTemplate } from '../types';

export const mockActivityTemplates: ActivityTemplate[] = [
  {
    id: 'tpl-1',
    title: 'Sentadillas (Cuádriceps)',
    description: 'Baja tu cadera manteniendo la espalda recta. Ideal para fortalecimiento de rodilla posterior a la operación.',
    type: 'PHYSICAL',
    videoUrl: 'placeholder'
  },
  {
    id: 'tpl-2',
    title: 'Estiramiento Lumbar',
    description: 'Postura del niño suave para extender la columna y relajar la musculatura inferior.',
    type: 'PHYSICAL',
    videoUrl: 'placeholder'
  },
  {
    id: 'tpl-3',
    title: 'Respiración de Caja',
    description: 'Inhala en 4s, sostén en 4s, exhala en 4s, sostén vacío en 4s.',
    type: 'BREATHING',
    videoUrl: 'placeholder'
  },
  {
    id: 'tpl-4',
    title: 'Elevación de Talón',
    description: 'Levanta ambos talones apoyado de una silla y baja lentamente. Ayuda a fuerza de pantorrilla.',
    type: 'PHYSICAL',
    videoUrl: 'placeholder'
  }
];

export const mockTherapist = {
  id: 't-1',
  name: 'Dr. Sarah Jenkins',
  role: 'THERAPIST' as const,
};

export const mockPatients: Patient[] = [
  {
    id: 'p-1',
    name: 'Michael Chen',
    role: 'PATIENT',
    age: 45,
    condition: 'Post-Op Knee Replacement',
    therapistId: 't-1',
    avatarUrl: 'https://i.pravatar.cc/150?u=michael',
  },
  {
    id: 'p-2',
    name: 'Elena Rodriguez',
    role: 'PATIENT',
    age: 32,
    condition: 'Chronic Lower Back Pain',
    therapistId: 't-1',
    avatarUrl: 'https://i.pravatar.cc/150?u=elena',
  },
];

export const mockRoutines: Routine[] = [
  {
    id: 'r-1',
    patientId: 'p-1',
    title: 'Morning Knee Mobility',
    type: 'TREATMENT',
    completed: false,
    assignedDate: new Date().toISOString(),
    activities: [
      {
        id: 'a-1',
        title: 'Heel Slides',
        description: 'Slowly slide your heel towards your glutes while keeping it on the bed.',
        durationMinutes: 5,
        repetitions: 15,
        type: 'PHYSICAL',
        order: 1,
      },
      {
        id: 'a-2',
        title: 'Quad Sets',
        description: 'Tighten your thigh muscle and push the back of your knee down.',
        durationMinutes: 5,
        repetitions: 15,
        type: 'PHYSICAL',
        order: 2,
      },
      {
        id: 'a-3',
        title: 'Deep Breathing',
        description: 'Inhale for 4 seconds, hold for 4, exhale for 6.',
        durationMinutes: 3,
        repetitions: 1,
        type: 'BREATHING',
        order: 3,
      }
    ],
  },
  {
    id: 'r-2',
    patientId: null, // Template
    title: 'General Back Relaxation',
    type: 'RELAXATION',
    completed: false,
    activities: [
      {
        id: 'a-4',
        title: 'Childs Pose',
        description: 'Hold the position, focusing on stretching the lower back.',
        durationMinutes: 2,
        repetitions: 1,
        type: 'PHYSICAL',
        order: 1,
      }
    ],
  }
];

export const mockFeedbacks: Feedback[] = [
  {
    id: 'f-1',
    routineId: 'r-1',
    patientId: 'p-1',
    painLevel: 4,
    emotionalState: 'GOOD',
    date: new Date(Date.now() - 86400000).toISOString(),
    aiSummary: 'Patient reports moderate pain but feels optimistic about mobility improvements.',
  }
];
