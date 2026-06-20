# FisioManager

Aplicación web para la gestión de sesiones de fisioterapia, desarrollada como proyecto para la asignatura de Análisis y Desarrollo de Software en ESCOM-IPN.

Permite a administradores, terapeutas y pacientes gestionar citas, rutinas de ejercicio y seguimiento del progreso terapéutico desde una sola plataforma.

## Stack tecnológico

| Capa | Tecnologías |
|---|---|
| Frontend | React 19, TypeScript, Vite, Zustand, TailwindCSS v4, React Router v7 |
| Backend | Node.js, Express 4, Prisma ORM, PostgreSQL, Socket.IO, JWT, Zod |
| Email | Nodemailer (Ethereal para pruebas o SMTP real) |

## Estructura del proyecto

```
fisiomanager/
├── src/                      # Frontend (React + TypeScript)
│   ├── components/           # Componentes reutilizables (ui/, layout/, ChatView, BodyMap, ThemeToggle…)
│   ├── pages/                # Vistas por rol: admin/ · therapist/ · patient/ · auth/ · shared/
│   ├── services/             # Cliente API (*.api.ts), socket.io-client
│   ├── store/                # Estado global (Zustand)
│   ├── locales/              # Traducciones i18n (es.json, en.json)
│   ├── lib/                  # theme.ts (modo claro/oscuro)
│   ├── utils/                # Utilidades (cn, date, url)
│   └── types/                # Tipos TypeScript
├── backend/
│   ├── src/                  # API REST (Express) + Socket.IO
│   │   ├── routes/           # Rutas (incluye comentarios @swagger → /api-docs)
│   │   ├── controllers/
│   │   ├── services/         # Lógica de negocio (chat, notificaciones, IA, storage…)
│   │   ├── repositories/     # Acceso a datos (Prisma)
│   │   ├── middlewares/      # auth, role, validate, upload, errores
│   │   ├── schemas/          # Validación con Zod
│   │   ├── config/           # Validación de entorno (env.ts)
│   │   ├── lib/              # prisma, socket, storage, observability, logger
│   │   ├── errors/ · utils/ · types/
│   │   └── __tests__/        # Pruebas (Jest)
│   ├── prisma/               # schema.prisma · migrations/ · seed.ts
│   └── Dockerfile
├── public/                   # Estáticos + iconos PWA
├── .github/workflows/        # CI (lint · test · build · docker)
├── docker-compose.yml        # Stack completo (postgres, backend, frontend, ollama, backups)
├── docker-compose.prod.yml   # Override de producción (Caddy/HTTPS, Redis, MinIO)
├── Caddyfile                 # Reverse-proxy con HTTPS automático
└── nginx.conf                # Frontend nginx (reverse-proxy /api, /uploads, /socket.io)
```

## Instalación y uso

### Requisitos

- Node.js 18+
- npm 9+
- PostgreSQL 14+ (local) — o usa el contenedor del `docker-compose.yml`. Para desarrollo rápido:
  `docker run -d --name fisio-pg -e POSTGRES_USER=fisio -e POSTGRES_PASSWORD=fisio -e POSTGRES_DB=fisiomanager -p 5432:5432 postgres:16-alpine`

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/fisiomanager.git
cd fisiomanager
```

### 2. Configurar variables de entorno

```bash
# Frontend
cp .env.example .env

# Backend
cp backend/.env.example backend/.env
```

Edita `backend/.env` y cambia `JWT_SECRET` por un valor seguro.

### 3. Instalar dependencias

```bash
# Frontend
npm install

# Backend
cd backend && npm install
```

### 4. Inicializar la base de datos

```bash
cd backend
npx prisma generate       # Genera el cliente Prisma
npm run db:migrate:deploy # Aplica las migraciones (crea las tablas)
npm run db:seed           # Carga datos de prueba
```

### 5. Modo desarrollo

Arranca backend y frontend con recarga rápida:

```bash
# Desde la raíz — inicia ambos en paralelo
npm run dev:all
```

O por separado:

```bash
cd backend && npm run dev   # Backend (ts-node-dev) en :3001
npm run dev                 # Frontend (Vite) en :5173
```

Abre `http://localhost:5173`.

### 6. Compilación / producción

Genera los artefactos optimizados (TypeScript → JS, bundle del frontend con code-splitting):

```bash
# Frontend → carpeta dist/ (estáticos para servir con nginx)
npm run build
npm run preview             # Previsualiza el build de producción

# Backend → backend/dist/
cd backend && npm run build
npm start                   # Ejecuta el backend compilado (node dist/server.js)
```

> Para levantar **todo el stack** (incluida la IA con Ollama/Whisper) con un solo comando, usa Docker — ver [DOCKER.md](./DOCKER.md).

## Cuentas de prueba

| Rol | Email | Contraseña |
|---|---|---|
| Administrador | admin@fisiomanager.com | admin123 |
| Terapeuta | sarah@fisiomanager.com | therapist123 |
| Paciente | michael@fisiomanager.com | patient123 |
| Paciente | elena@fisiomanager.com | patient123 |

## Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm run dev:all` | Inicia backend y frontend en paralelo (desarrollo) |
| `npm run dev` | Solo el frontend (Vite) |
| `npm run build` | Build de producción del frontend (code-splitting + PWA) |
| `npm run preview` | Previsualiza el build de producción del frontend |
| `npm run lint` | Linter del frontend |
| `npm test` | Pruebas del frontend (Vitest) |
| `cd backend && npm run dev` | Solo el backend (recarga en caliente) |
| `cd backend && npm run build` | Compila el backend a `dist/` |
| `cd backend && npm start` | Ejecuta el backend compilado |
| `cd backend && npm test` | Pruebas del backend (Jest) |
| `cd backend && npm run db:migrate` | Crea/aplica una migración en desarrollo |
| `cd backend && npm run db:migrate:deploy` | Aplica migraciones pendientes (producción) |
| `cd backend && npm run db:seed` | Recarga los datos de prueba |
| `cd backend && npm run db:reset` | Resetea y re-semilla la BD completa |
| `cd backend && npm run db:studio` | Abre Prisma Studio (explorador visual de BD) |

## Módulos implementados

- **Autenticación** — JWT con refresh tokens, rutas protegidas por rol, recuperación de contraseña
- **Paciente** — Rutinas y reproductor, check-in de bienestar con mapa corporal de dolor, progreso, auto-agendamiento de citas y lista de espera
- **Terapeuta** — Dashboard, biblioteca/constructor de rutinas, historial clínico (CIE-10) con documentos, planes de tratamiento, escalas de resultado, analítica
- **Administrador** — Agenda, citas (CRUD + recurrentes), pacientes, doctores, salas, asignaciones, usuarios, bitácora de auditoría
- **Mensajería** — Chat paciente↔terapeuta en tiempo real (Socket.IO)
- **Notificaciones** — Centro in-app + email (Nodemailer), con horario silencioso
- **IA** — Transcripción de audio (Whisper) y resúmenes clínicos (Ollama)
- **Plataforma** — i18n (es/en), modo claro/oscuro, PWA con modo offline, healthchecks, auditoría y endurecimiento de seguridad

## Variables de entorno

### Frontend (`.env`)

```env
VITE_API_URL=http://localhost:3001/api
```

### Backend (`backend/.env`)

```env
DATABASE_URL="postgresql://fisio:fisio@localhost:5432/fisiomanager?schema=public"
JWT_SECRET="cambia-esto-por-un-secreto-seguro"
PORT=3001
CORS_ORIGIN="http://localhost:5173"

# Opcional — SMTP para email real
EMAIL_HOST=smtp.tuproveedor.com
EMAIL_USER=tu@email.com
EMAIL_PASS=tu_contrasena
EMAIL_FROM="FisioManager <tu@email.com>"
```
