import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from './store/useStore';

import { PatientLayout } from './components/layout/PatientLayout';
import { TherapistLayout } from './components/layout/TherapistLayout';
import { AdminLayout } from './components/layout/AdminLayout';

const lazyNamed = <T extends Record<string, React.ComponentType<unknown>>>(
  factory: () => Promise<T>,
  name: keyof T,
) => lazy(() => factory().then(m => ({ default: m[name] })));

const LoginPage = lazyNamed(() => import('./pages/auth/LoginPage'), 'LoginPage');
const ForgotPasswordPage = lazyNamed(() => import('./pages/auth/ForgotPasswordPage'), 'ForgotPasswordPage');
const ResetPasswordPage = lazyNamed(() => import('./pages/auth/ResetPasswordPage'), 'ResetPasswordPage');

const PatientHome = lazyNamed(() => import('./pages/patient/PatientHome'), 'PatientHome');
const PatientRoutines = lazyNamed(() => import('./pages/patient/PatientRoutines'), 'PatientRoutines');
const RoutinePlayer = lazyNamed(() => import('./pages/patient/RoutinePlayer'), 'RoutinePlayer');
const ProgressView = lazyNamed(() => import('./pages/patient/ProgressView'), 'ProgressView');
const WellnessView = lazyNamed(() => import('./pages/patient/WellnessView'), 'WellnessView');
const FeedbackView = lazyNamed(() => import('./pages/patient/FeedbackView'), 'FeedbackView');
const WellnessCheckin = lazyNamed(() => import('./pages/patient/WellnessCheckin'), 'WellnessCheckin');
const PatientSettings = lazyNamed(() => import('./pages/patient/PatientSettings'), 'PatientSettings');
const BookAppointment = lazyNamed(() => import('./pages/patient/BookAppointment'), 'BookAppointment');

const TherapistDashboard = lazyNamed(() => import('./pages/therapist/TherapistDashboard'), 'TherapistDashboard');
const PatientsList = lazyNamed(() => import('./pages/therapist/PatientsList'), 'PatientsList');
const PatientDetail = lazyNamed(() => import('./pages/therapist/PatientDetail'), 'PatientDetail');
const RoutineLibrary = lazyNamed(() => import('./pages/therapist/RoutineLibrary'), 'RoutineLibrary');
const RoutineBuilder = lazyNamed(() => import('./pages/therapist/RoutineBuilder'), 'RoutineBuilder');
const ExerciseLibrary = lazyNamed(() => import('./pages/therapist/ExerciseLibrary'), 'ExerciseLibrary');
const AnalyticsView = lazyNamed(() => import('./pages/therapist/AnalyticsView'), 'AnalyticsView');
const SettingsView = lazyNamed(() => import('./pages/therapist/SettingsView'), 'SettingsView');

const AdminDashboard = lazyNamed(() => import('./pages/admin/AdminDashboard'), 'AdminDashboard');
const AdminAppointments = lazyNamed(() => import('./pages/admin/AdminAppointments'), 'AdminAppointments');
const AdminPatients = lazyNamed(() => import('./pages/admin/AdminPatients'), 'AdminPatients');
const AdminDoctors = lazyNamed(() => import('./pages/admin/AdminDoctors'), 'AdminDoctors');
const AdminAssignments = lazyNamed(() => import('./pages/admin/AdminAssignments'), 'AdminAssignments');
const AdminUsers = lazyNamed(() => import('./pages/admin/AdminUsers'), 'AdminUsers');
const AdminRooms = lazyNamed(() => import('./pages/admin/AdminRooms'), 'AdminRooms');
const AdminAudit = lazyNamed(() => import('./pages/admin/AdminAudit'), 'AdminAudit');

const NotificationsView = lazyNamed(() => import('./pages/shared/NotificationsView'), 'NotificationsView');
const ChatView = lazyNamed(() => import('./pages/shared/ChatView'), 'ChatView');

function RequireAuth({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useStore(state => state.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppRedirect() {
  const isAuthenticated = useStore(state => state.isAuthenticated);
  const role = useStore(state => state.role);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (role === 'PATIENT') return <Navigate to="/patient" replace />;
  if (role === 'ADMIN') return <Navigate to="/admin" replace />;
  return <Navigate to="/therapist" replace />;
}

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-10 h-10 rounded-full border-4 border-surface-container-high border-t-primary animate-spin" />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/" element={<AppRedirect />} />

          <Route path="/patient" element={<RequireAuth><PatientLayout /></RequireAuth>}>
            <Route index element={<PatientHome />} />
            <Route path="routines" element={<PatientRoutines />} />
            <Route path="routines/:id" element={<RoutinePlayer />} />
            <Route path="wellness" element={<WellnessView />} />
            <Route path="progress" element={<ProgressView />} />
            <Route path="feedback" element={<FeedbackView />} />
            <Route path="wellness-checkin" element={<WellnessCheckin />} />
            <Route path="notifications" element={<NotificationsView />} />
            <Route path="messages" element={<ChatView />} />
            <Route path="book" element={<BookAppointment />} />
            <Route path="settings" element={<PatientSettings />} />
          </Route>

          <Route path="/therapist" element={<RequireAuth><TherapistLayout /></RequireAuth>}>
            <Route index element={<TherapistDashboard />} />
            <Route path="patients" element={<PatientsList />} />
            <Route path="patients/:id" element={<PatientDetail />} />
            <Route path="exercises" element={<ExerciseLibrary />} />
            <Route path="routines" element={<RoutineLibrary />} />
            <Route path="routines/builder" element={<RoutineBuilder />} />
            <Route path="routines/builder/:id" element={<RoutineBuilder />} />
            <Route path="analytics" element={<AnalyticsView />} />
            <Route path="notifications" element={<NotificationsView />} />
            <Route path="messages" element={<ChatView />} />
            <Route path="settings" element={<SettingsView />} />
          </Route>

          <Route path="/admin" element={<RequireAuth><AdminLayout /></RequireAuth>}>
            <Route index element={<AdminDashboard />} />
            <Route path="citas" element={<AdminAppointments />} />
            <Route path="pacientes" element={<AdminPatients />} />
            <Route path="doctores" element={<AdminDoctors />} />
            <Route path="salas" element={<AdminRooms />} />
            <Route path="asignaciones" element={<AdminAssignments />} />
            <Route path="usuarios" element={<AdminUsers />} />
            <Route path="auditoria" element={<AdminAudit />} />
            <Route path="notificaciones" element={<NotificationsView />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
