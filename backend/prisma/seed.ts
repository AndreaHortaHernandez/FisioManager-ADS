import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed...');

  // ── Administrador ────────────────────────────────────────────────
  await prisma.user.upsert({
    where: { email: 'admin@fisiomanager.com' },
    update: {},
    create: {
      name: 'Admin FisioManager',
      email: 'admin@fisiomanager.com',
      password: await bcrypt.hash('admin123', 10),
      role: 'ADMIN',
    },
  });
  console.log('🔑 Admin creado: admin@fisiomanager.com');

  // ── Terapeuta ────────────────────────────────────────────────────
  const therapist = await prisma.user.upsert({
    where: { email: 'sarah@fisiomanager.com' },
    update: {},
    create: {
      name: 'Dr. Sarah Jenkins',
      email: 'sarah@fisiomanager.com',
      password: await bcrypt.hash('therapist123', 10),
      role: 'THERAPIST',
    },
  });
  console.log('👩‍⚕️ Terapeuta creada:', therapist.email);

  // ── Pacientes ────────────────────────────────────────────────────
  const michael = await prisma.user.upsert({
    where: { email: 'michael@fisiomanager.com' },
    update: {},
    create: {
      name: 'Michael Chen',
      email: 'michael@fisiomanager.com',
      password: await bcrypt.hash('patient123', 10),
      role: 'PATIENT',
      avatarUrl: 'https://i.pravatar.cc/150?u=michael',
      patientProfile: {
        create: {
          age: 45,
          condition: 'Post-Op Knee Replacement',
          therapistId: therapist.id,
        },
      },
    },
  });

  const elena = await prisma.user.upsert({
    where: { email: 'elena@fisiomanager.com' },
    update: {},
    create: {
      name: 'Elena Rodriguez',
      email: 'elena@fisiomanager.com',
      password: await bcrypt.hash('patient123', 10),
      role: 'PATIENT',
      avatarUrl: 'https://i.pravatar.cc/150?u=elena',
      patientProfile: {
        create: {
          age: 32,
          condition: 'Chronic Lower Back Pain',
          therapistId: therapist.id,
        },
      },
    },
  });
  console.log('🧑‍🦱 Pacientes creados:', michael.email, elena.email);

  // ── Plantillas de actividades ────────────────────────────────────
  const templates = await Promise.all([
    prisma.activityTemplate.upsert({
      where: { id: 'tpl-1' },
      update: {},
      create: {
        id: 'tpl-1',
        title: 'Sentadillas (Cuádriceps)',
        description: 'Baja tu cadera manteniendo la espalda recta. Ideal para fortalecimiento de rodilla.',
        type: 'PHYSICAL',
      },
    }),
    prisma.activityTemplate.upsert({
      where: { id: 'tpl-2' },
      update: {},
      create: {
        id: 'tpl-2',
        title: 'Estiramiento Lumbar',
        description: 'Postura del niño suave para extender la columna y relajar la musculatura inferior.',
        type: 'PHYSICAL',
      },
    }),
    prisma.activityTemplate.upsert({
      where: { id: 'tpl-3' },
      update: {},
      create: {
        id: 'tpl-3',
        title: 'Respiración de Caja',
        description: 'Inhala en 4s, sostén en 4s, exhala en 4s, sostén vacío en 4s.',
        type: 'BREATHING',
      },
    }),
    prisma.activityTemplate.upsert({
      where: { id: 'tpl-4' },
      update: {},
      create: {
        id: 'tpl-4',
        title: 'Elevación de Talón',
        description: 'Levanta ambos talones apoyado de una silla y baja lentamente.',
        type: 'PHYSICAL',
      },
    }),
  ]);
  console.log('📋 Plantillas creadas:', templates.length);

  // ── Rutinas ───────────────────────────────────────────────────────
  const routine1 = await prisma.routine.upsert({
    where: { id: 'r-1' },
    update: {},
    create: {
      id: 'r-1',
      patientId: michael.id,
      title: 'Morning Knee Mobility',
      type: 'TREATMENT',
      completed: false,
      assignedDate: new Date(),
      activities: {
        createMany: {
          data: [
            {
              title: 'Heel Slides',
              description: 'Slowly slide your heel towards your glutes while keeping it on the bed.',
              durationMinutes: 5,
              repetitions: 15,
              type: 'PHYSICAL',
              order: 1,
            },
            {
              title: 'Quad Sets',
              description: 'Tighten your thigh muscle and push the back of your knee down.',
              durationMinutes: 5,
              repetitions: 15,
              type: 'PHYSICAL',
              order: 2,
            },
            {
              title: 'Deep Breathing',
              description: 'Inhale for 4 seconds, hold for 4, exhale for 6.',
              durationMinutes: 3,
              repetitions: 1,
              type: 'BREATHING',
              order: 3,
            },
          ],
        },
      },
    },
  });

  await prisma.routine.upsert({
    where: { id: 'r-2' },
    update: {},
    create: {
      id: 'r-2',
      patientId: null,
      title: 'General Back Relaxation',
      type: 'RELAXATION',
      completed: false,
      activities: {
        createMany: {
          data: [
            {
              title: "Child's Pose",
              description: 'Hold the position, focusing on stretching the lower back.',
              durationMinutes: 2,
              repetitions: 1,
              type: 'PHYSICAL',
              order: 1,
            },
          ],
        },
      },
    },
  });
  console.log('🏃 Rutinas creadas');

  // ── Feedback ──────────────────────────────────────────────────────
  await prisma.feedback.upsert({
    where: { id: 'fb-1' },
    update: {},
    create: {
      id: 'fb-1',
      routineId: routine1.id,
      patientId: michael.id,
      painLevel: 4,
      emotionalState: 'GOOD',
      date: new Date(Date.now() - 86400000),
      aiSummary: 'Patient reports moderate pain but feels optimistic about mobility improvements.',
    },
  });
  console.log('💬 Feedback creado');

  // ── Citas de ejemplo ─────────────────────────────────────────────
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  await prisma.appointment.upsert({
    where: { id: 'apt-1' },
    update: {},
    create: {
      id: 'apt-1',
      patientId: michael.id,
      therapistId: therapist.id,
      dateTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 0),
      status: 'SCHEDULED',
      notes: 'Sesión de rehabilitación de rodilla — semana 3',
    },
  });

  await prisma.appointment.upsert({
    where: { id: 'apt-2' },
    update: {},
    create: {
      id: 'apt-2',
      patientId: elena.id,
      therapistId: therapist.id,
      dateTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 11, 30),
      status: 'SCHEDULED',
      notes: 'Evaluación de dolor lumbar',
    },
  });

  await prisma.appointment.upsert({
    where: { id: 'apt-3' },
    update: {},
    create: {
      id: 'apt-3',
      patientId: michael.id,
      therapistId: therapist.id,
      dateTime: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 10, 0),
      status: 'SCHEDULED',
    },
  });
  console.log('📅 Citas de ejemplo creadas');

  // ── Disponibilidad del terapeuta (HorarioDisponible) ─────────────
  await prisma.therapistAvailability.deleteMany({ where: { therapistId: therapist.id } });
  await prisma.therapistAvailability.createMany({
    data: [
      { therapistId: therapist.id, dayOfWeek: 1, startTime: '08:00', endTime: '18:00' },
      { therapistId: therapist.id, dayOfWeek: 2, startTime: '08:00', endTime: '18:00' },
      { therapistId: therapist.id, dayOfWeek: 3, startTime: '08:00', endTime: '18:00' },
      { therapistId: therapist.id, dayOfWeek: 4, startTime: '08:00', endTime: '18:00' },
      { therapistId: therapist.id, dayOfWeek: 5, startTime: '08:00', endTime: '18:00' },
      { therapistId: therapist.id, dayOfWeek: 6, startTime: '09:00', endTime: '13:00' },
    ],
  });
  console.log('🗓️  Disponibilidad del terapeuta creada (Lun-Sáb)');

  // ── Historial clínico de ejemplo ─────────────────────────────────
  const history = await prisma.clinicalHistory.upsert({
    where: { patientId: michael.id },
    update: {},
    create: {
      patientId: michael.id,
      bloodType: 'O+',
      allergies: 'Ninguna conocida',
      background: 'Reemplazo total de rodilla derecha (2025)',
    },
  });
  await prisma.diagnosis.upsert({
    where: { id: 'dx-1' },
    update: {},
    create: {
      id: 'dx-1',
      historyId: history.id,
      cie10Code: 'M17.1',
      description: 'Gonartrosis primaria de rodilla',
      status: 'ACTIVE',
    },
  });
  await prisma.clinicalNote.upsert({
    where: { id: 'note-1' },
    update: {},
    create: {
      id: 'note-1',
      historyId: history.id,
      authorId: therapist.id,
      content: 'Paciente con buena adherencia al tratamiento. Continuar fortalecimiento de cuádriceps.',
    },
  });
  console.log('🩺 Historial clínico de ejemplo creado');

  console.log('\n✅ Seed completado.\n');
  console.log('Cuentas de prueba:');
  console.log('  Admin      → admin@fisiomanager.com   / admin123');
  console.log('  Terapeuta  → sarah@fisiomanager.com   / therapist123');
  console.log('  Paciente 1 → michael@fisiomanager.com / patient123');
  console.log('  Paciente 2 → elena@fisiomanager.com   / patient123');
}

main()
  .catch(err => { console.error(err); process.exit(1); })
  .finally(() => prisma.$disconnect());
