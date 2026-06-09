import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Patient, Routine, Feedback, Role, ActivityTemplate } from '../types';
import { setAuthToken } from '../services/api';
import { authApi, type AuthUser } from '../services/auth.api';
import { patientsApi } from '../services/patients.api';
import { routinesApi } from '../services/routines.api';
import { feedbackApi } from '../services/feedback.api';
import { activityTemplatesApi } from '../services/activityTemplates.api';

interface AppState {
  // Auth
  isAuthenticated: boolean;
  token: string | null;
  authUser: AuthUser | null;

  // Campos mantenidos por compatibilidad con componentes existentes
  role: Role;
  currentUser: string | null;

  // Datos de la aplicación
  patients: Patient[];
  routines: Routine[];
  feedbacks: Feedback[];
  activityTemplates: ActivityTemplate[];

  // Acciones de auth
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;

  // Carga de datos
  loadData: () => Promise<void>;

  // Acciones de dominio (sincronizan con la API)
  markRoutineComplete: (routineId: string) => Promise<void>;
  addFeedback: (data: {
    routineId: string;
    patientId: string;
    painLevel: number;
    emotionalState: Feedback['emotionalState'];
    audioRecordUrl?: string;
    aiSummary?: string;
  }) => Promise<void>;
  addRoutine: (routine: {
    title: string;
    type: 'TREATMENT' | 'RELAXATION';
    patientId?: string | null;
    activities: Omit<Routine['activities'][number], 'id'>[];
  }) => Promise<void>;
  assignRoutineToPatients: (routineId: string, patientIds: string[]) => Promise<void>;
  addActivityTemplate: (formData: FormData) => Promise<void>;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      token: null,
      authUser: null,
      role: 'PATIENT',
      currentUser: null,
      patients: [],
      routines: [],
      feedbacks: [],
      activityTemplates: [],

      login: async (email, password) => {
        const { token, user } = await authApi.login(email, password);
        setAuthToken(token);
        set({
          isAuthenticated: true,
          token,
          authUser: user,
          role: user.role,
          currentUser: user.id,
        });
        await get().loadData();
      },

      logout: () => {
        setAuthToken(null);
        set({
          isAuthenticated: false,
          token: null,
          authUser: null,
          role: 'PATIENT',
          currentUser: null,
          patients: [],
          routines: [],
          feedbacks: [],
          activityTemplates: [],
        });
      },

      loadData: async () => {
        const { role } = get();
        const [templates, routines, feedbacks] = await Promise.all([
          activityTemplatesApi.getAll(),
          routinesApi.getAll(),
          feedbackApi.getAll(),
        ]);

        const patients = role === 'THERAPIST' ? await patientsApi.getAll() : [];

        set({ activityTemplates: templates, routines, feedbacks, patients });
      },

      markRoutineComplete: async (routineId) => {
        const updated = await routinesApi.markComplete(routineId);
        set(state => ({
          routines: state.routines.map(r => r.id === routineId ? { ...r, ...updated } : r),
        }));
      },

      addFeedback: async (data) => {
        const created = await feedbackApi.create(data);
        set(state => ({ feedbacks: [created, ...state.feedbacks] }));
      },

      addRoutine: async (data) => {
        const created = await routinesApi.create(data);
        set(state => ({ routines: [created, ...state.routines] }));
      },

      assignRoutineToPatients: async (routineId, patientIds) => {
        const newRoutines = await routinesApi.assignToPatients(routineId, patientIds);
        set(state => ({ routines: [...state.routines, ...newRoutines] }));
      },

      addActivityTemplate: async (formData) => {
        const created = await activityTemplatesApi.create(formData);
        set(state => ({ activityTemplates: [...state.activityTemplates, created] }));
      },
    }),
    {
      name: 'fisiomanager-storage',
      partialize: (state) => ({
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        authUser: state.authUser,
        role: state.role,
        currentUser: state.currentUser,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.token) setAuthToken(state.token);
      },
    }
  )
);
