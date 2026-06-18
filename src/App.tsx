import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from './store/useStore';

import { PatientLayout } from './components/layout/PatientLayout';
import { TherapistLayout } from './components/layout/TherapistLayout';
import { AdminLayout } from './components/layout/AdminLayout';

import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminAppointments } from './pages/admin/AdminAppointments';
import { AdminPatients } from './pages/admin/AdminPatients';
import { AdminDoctors } from './pages/admin/AdminDoctors';
import { AdminAssignments } from './pages/admin/AdminAssignments';
import { AdminUsers } from './pages/admin/AdminUsers';
import { AdminRooms } from './pages/admin/AdminRooms';

import { LoginPage } from './pages/auth/LoginPage';

import { PatientHome } from './pages/patient/PatientHome';
import { PatientRoutines } from './pages/patient/PatientRoutines';
import { RoutinePlayer } from './pages/patient/RoutinePlayer';
import { ProgressView } from './pages/patient/ProgressView';
import { WellnessView } from './pages/patient/WellnessView';
import { FeedbackView } from './pages/patient/FeedbackView';
import { WellnessCheckin } from './pages/patient/WellnessCheckin';
import { PatientSettings } from './pages/patient/PatientSettings';

import { TherapistDashboard } from './pages/therapist/TherapistDashboard';
import { PatientsList } from './pages/therapist/PatientsList';
import { PatientDetail } from './pages/therapist/PatientDetail';
import { RoutineLibrary } from './pages/therapist/RoutineLibrary';
import { RoutineBuilder } from './pages/therapist/RoutineBuilder';
import { ExerciseLibrary } from './pages/therapist/ExerciseLibrary';
import { AnalyticsView } from './pages/therapist/AnalyticsView';
import { SettingsView } from './pages/therapist/SettingsView';

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

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<AppRedirect />} />

        {}
        <Route path="/patient" element={<RequireAuth><PatientLayout /></RequireAuth>}>
          <Route index element={<PatientHome />} />
          <Route path="routines" element={<PatientRoutines />} />
          <Route path="routines/:id" element={<RoutinePlayer />} />
          <Route path="wellness" element={<WellnessView />} />
          <Route path="progress" element={<ProgressView />} />
          <Route path="feedback" element={<FeedbackView />} />
          <Route path="wellness-checkin" element={<WellnessCheckin />} />
          <Route path="settings" element={<PatientSettings />} />
        </Route>

        {}
        <Route path="/therapist" element={<RequireAuth><TherapistLayout /></RequireAuth>}>
          <Route index element={<TherapistDashboard />} />
          <Route path="patients" element={<PatientsList />} />
          <Route path="patients/:id" element={<PatientDetail />} />
          <Route path="exercises" element={<ExerciseLibrary />} />
          <Route path="routines" element={<RoutineLibrary />} />
          <Route path="routines/builder" element={<RoutineBuilder />} />
          <Route path="routines/builder/:id" element={<RoutineBuilder />} />
          <Route path="analytics" element={<AnalyticsView />} />
          <Route path="settings" element={<SettingsView />} />
        </Route>

        {}
        <Route path="/admin" element={<RequireAuth><AdminLayout /></RequireAuth>}>
          <Route index element={<AdminDashboard />} />
          <Route path="citas" element={<AdminAppointments />} />
          <Route path="pacientes" element={<AdminPatients />} />
          <Route path="doctores" element={<AdminDoctors />} />
          <Route path="salas" element={<AdminRooms />} />
          <Route path="asignaciones" element={<AdminAssignments />} />
          <Route path="usuarios" element={<AdminUsers />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
