import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Patient, Routine, Feedback, Role, ActivityTemplate, RoutineAssignment, AssignmentFrequency, AssignmentStatus } from '../types';
import { setAuthToken, setRefreshToken, registerAuthHandlers } from '../services/api';
import { authApi, type AuthUser } from '../services/auth.api';
import { patientsApi } from '../services/patients.api';
import { routinesApi } from '../services/routines.api';
import { feedbackApi } from '../services/feedback.api';
import { activityTemplatesApi } from '../services/activityTemplates.api';
import { routineAssignmentsApi } from '../services/routineAssignments.api';

interface AppState {

  isAuthenticated: boolean;
  token: string | null;
  refreshToken: string | null;
  authUser: AuthUser | null;

  role: Role;
  currentUser: string | null;

  patients: Patient[];
  routines: Routine[];
  feedbacks: Feedback[];
  activityTemplates: ActivityTemplate[];
  routineAssignments: RoutineAssignment[];

  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  applySession: (token: string, user: AuthUser, refreshToken?: string) => Promise<void>;
  logout: () => void;
  giveAudioConsent: () => Promise<void>;
  updateProfile: (data: { phone?: string; avatarUrl?: string }) => Promise<void>;
  uploadAvatar: (file: File) => Promise<void>;

  loadData: () => Promise<void>;

  markRoutineComplete: (routineId: string) => Promise<void>;
  markRoutineCompletedLocally: (routineId: string) => void;
  addFeedback: (data: {
    routineId?:     string;
    patientId:      string;
    painLevel:      number;
    emotionalState: Feedback['emotionalState'];
    audioRecordUrl?: string;
    transcript?:    string;
    aiSummary?:     string;
  }) => Promise<void>;
  addRoutine: (routine: {
    title: string;
    type: 'TREATMENT' | 'RELAXATION';
    patientId?: string | null;
    activities: Omit<Routine['activities'][number], 'id'>[];
  }) => Promise<void>;
  assignRoutineToPatients: (routineId: string, patientIds: string[]) => Promise<void>;
  addActivityTemplate: (formData: FormData) => Promise<void>;
  deleteActivityTemplate: (id: string) => Promise<void>;
  cloneRoutine: (routineId: string) => Promise<void>;
  updateRoutine: (id: string, data: {
    title: string;
    type: 'TREATMENT' | 'RELAXATION';
    activities: Omit<Routine['activities'][number], 'id'>[];
  }) => Promise<void>;
  deleteRoutine: (id: string) => Promise<void>;
  createAssignment: (data: {
    routineId: string;
    patientId: string;
    startDate: string;
    endDate?: string;
    frequency: AssignmentFrequency;
  }) => Promise<void>;
  updateAssignmentStatus: (id: string, status: AssignmentStatus) => Promise<void>;
  loadAssignments: () => Promise<void>;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      token: null,
      refreshToken: null,
      authUser: null,
      role: 'PATIENT',
      currentUser: null,
      patients: [],
      routines: [],
      feedbacks: [],
      activityTemplates: [],
      routineAssignments: [],

      login: async (email, password) => {
        const { token, refreshToken, user } = await authApi.login(email, password);
        await get().applySession(token, user, refreshToken);
      },

      signup: async (name, email, password) => {
        const { token, refreshToken, user } = await authApi.signup(name, email, password);
        await get().applySession(token, user, refreshToken);
      },

      applySession: async (token, user, refreshToken) => {
        setAuthToken(token);
        if (refreshToken) setRefreshToken(refreshToken);
        set({
          isAuthenticated: true,
          token,
          refreshToken: refreshToken ?? get().refreshToken,
          authUser: user,
          role: user.role,
          currentUser: user.id,
        });
        await get().loadData();
      },

      logout: () => {

        authApi.logout(get().refreshToken).catch(() => {  });
        setAuthToken(null);
        setRefreshToken(null);
        set({
          isAuthenticated: false,
          token: null,
          refreshToken: null,
          authUser: null,
          role: 'PATIENT',
          currentUser: null,
          patients: [],
          routines: [],
          feedbacks: [],
          activityTemplates: [],
          routineAssignments: [],
        });
      },

      giveAudioConsent: async () => {
        const { audioConsentAt } = await authApi.giveConsent();
        set(state => ({ authUser: state.authUser ? { ...state.authUser, audioConsentAt } : state.authUser }));
      },

      updateProfile: async (data) => {
        const updated = await authApi.updateProfile(data);
        set(state => ({ authUser: state.authUser ? { ...state.authUser, ...updated } : state.authUser }));
      },

      uploadAvatar: async (file) => {
        const updated = await authApi.uploadAvatar(file);
        set(state => ({ authUser: state.authUser ? { ...state.authUser, ...updated } : state.authUser }));
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

      markRoutineCompletedLocally: (routineId) => {
        set(state => ({
          routines: state.routines.map(r => r.id === routineId ? { ...r, completed: true } : r),
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

      deleteActivityTemplate: async (id) => {
        await activityTemplatesApi.delete(id);
        set(state => ({ activityTemplates: state.activityTemplates.filter(t => t.id !== id) }));
      },

      cloneRoutine: async (routineId) => {
        const cloned = await routinesApi.clone(routineId);
        set(state => ({ routines: [cloned, ...state.routines] }));
      },

      updateRoutine: async (id, data) => {
        const updated = await routinesApi.update(id, data);
        set(state => ({
          routines: state.routines.map(r => r.id === id ? updated : r),
        }));
      },

      deleteRoutine: async (id) => {
        await routinesApi.delete(id);
        set(state => ({ routines: state.routines.filter(r => r.id !== id) }));
      },

      loadAssignments: async () => {
        const assignments = await routineAssignmentsApi.getAll();
        set({ routineAssignments: assignments });
      },

      createAssignment: async (data) => {
        const created = await routineAssignmentsApi.create(data);
        set(state => ({ routineAssignments: [created, ...state.routineAssignments] }));

        const routines = await routinesApi.getAll();
        set({ routines });
      },

      updateAssignmentStatus: async (id, status) => {
        const updated = await routineAssignmentsApi.updateStatus(id, status);
        set(state => ({
          routineAssignments: state.routineAssignments.map(a => a.id === id ? updated : a),
        }));
      },
    }),
    {
      name: 'fisiomanager-storage',
      partialize: (state) => ({
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        authUser: state.authUser,
        role: state.role,
        currentUser: state.currentUser,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.token) setAuthToken(state.token);
        if (state?.refreshToken) setRefreshToken(state.refreshToken);
      },
    }
  )
);

registerAuthHandlers({
  onTokensRefreshed: (token, refreshToken) => {
    useStore.setState({ token, refreshToken });
  },
  onSessionExpired: () => {
    useStore.getState().logout();
  },
});
