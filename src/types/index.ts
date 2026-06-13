export type Role = 'PATIENT' | 'THERAPIST' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  role: Role;
  avatarUrl?: string;
}

export interface Patient extends User {
  role: 'PATIENT';
  age: number;
  condition: string;
  therapistId: string;
  isActive: boolean;
  email?: string;
  phone?: string;
}

export interface Activity {
  id: string;
  templateId?: string; // Reference to the video template
  title: string;
  description: string;
  durationMinutes: number; // or seconds
  restSeconds?: number;
  repetitions: number;
  type: 'PHYSICAL' | 'BREATHING';
  order: number;
  videoUrl?: string; // the actual video
}

export type BodyPart = 'KNEE' | 'BACK' | 'SHOULDER' | 'NECK' | 'ARM' | 'HIP' | 'ANKLE' | 'OTHER';

export interface ActivityTemplate {
  id: string;
  title: string;
  description: string;
  type: 'PHYSICAL' | 'BREATHING';
  bodyPart?: BodyPart;
  videoUrl?: string;
  imageUrl?: string;
}

export interface Routine {
  id: string;
  patientId: string | null; // null if it is a template in Library
  title: string;
  type: 'TREATMENT' | 'RELAXATION';
  activities: Activity[];
  assignedDate?: string;
  completed: boolean;
}

export interface Feedback {
  id: string;
  routineId: string;
  patientId: string;
  painLevel: number; // 1-10
  emotionalState: 'GREAT' | 'GOOD' | 'OK' | 'BAD' | 'TERRIBLE';
  audioRecordUrl?: string;
  aiSummary?: string;
  transcript?: string;
  date: string;
}

export interface Therapist {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  isActive: boolean;
  role: 'THERAPIST';
  therapistProfile?: { cedula?: string; especialidad?: string } | null;
}

export type AssignmentFrequency = 'DAILY' | 'EVERY_OTHER_DAY' | 'WEEKLY';
export type AssignmentStatus   = 'ACTIVE' | 'PAUSED' | 'CANCELLED';

export interface RoutineAssignment {
  id:          string;
  routineId:   string;
  patientId:   string;
  therapistId: string;
  startDate:   string;
  endDate?:    string;
  frequency:   AssignmentFrequency;
  status:      AssignmentStatus;
  createdAt:   string;
  routine?:    { id: string; title: string; type: string };
  patient?:    { id: string; name: string; avatarUrl?: string };
}

export type AppointmentStatus = 'SCHEDULED' | 'CANCELLED' | 'COMPLETED';

export interface Appointment {
  id: string;
  patientId: string;
  therapistId: string;
  dateTime: string;
  status: AppointmentStatus;
  notes?: string;
  patient: { id: string; name: string; email: string; phone?: string; avatarUrl?: string };
  therapist: { id: string; name: string; email: string };
}
