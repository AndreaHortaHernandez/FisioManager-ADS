# FisioManager

Aplicación web para la gestión de sesiones de fisioterapia, desarrollada como proyecto para la asignatura de Análisis y Desarrollo de Software en ESCOM-IPN.

Permite a administradores, terapeutas y pacientes gestionar citas, rutinas de ejercicio y seguimiento del progreso terapéutico desde una sola plataforma.

## Stack tecnológico

| Capa | Tecnologías |
|---|---|
| Frontend | React 19, TypeScript, Vite, Zustand, TailwindCSS v4, React Router v7 |
| Backend | Node.js, Express 4, Prisma ORM, SQLite, JWT, Zod |
| Email | Nodemailer (Ethereal para pruebas o SMTP real) |

## Estructura del proyecto

```
fisiomanager/
├── src/                  # Frontend (React + TypeScript)
│   ├── components/       # Componentes reutilizables
│   ├── pages/            # Vistas por rol (admin, therapist, patient)
│   ├── services/         # Llamadas a la API
│   ├── store/            # Estado global (Zustand)
│   └── types/            # Tipos TypeScript
├── backend/
│   ├── src/              # API REST (Express)
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── services/
│   │   └── repositories/
│   └── prisma/           # Schema y migraciones de BD
└── public/
```

## Instalación y uso

### Requisitos

- Node.js 18+
- npm 9+

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
npm run db:push   # Crea las tablas
npm run db:seed   # Carga datos de prueba
```

### 5. Iniciar los servidores

```bash
# Desde la raíz — inicia backend y frontend juntos
npm run dev:all
```

O por separado:

```bash
# Backend (puerto 3001)
cd backend && npm run dev

# Frontend (puerto 5173)
npm run dev
```

Abre `http://localhost:5173` en tu navegador.

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
| `npm run dev:all` | Inicia backend y frontend en paralelo |
| `npm run dev` | Solo el frontend (Vite) |
| `npm run build` | Build de producción del frontend |
| `cd backend && npm run dev` | Solo el backend |
| `cd backend && npm run db:push` | Aplica cambios del schema a la BD |
| `cd backend && npm run db:seed` | Recarga los datos de prueba |
| `cd backend && npm run db:reset` | Resetea y re-semilla la BD completa |
| `cd backend && npm run db:studio` | Abre Prisma Studio (explorador visual de BD) |

## Módulos implementados

- **Autenticación** — Login con JWT, rutas protegidas por rol, logout
- **Vista Paciente** — Home, RoutinePlayer, FeedbackView
- **Vista Terapeuta** — Dashboard, RoutineLibrary, RoutineBuilder
- **Vista Administrador** — Agenda del día, Citas (CRUD), Pacientes, Doctores, Asignaciones
- **Email** — Recordatorios de citas vía Nodemailer

## Variables de entorno

### Frontend (`.env`)

```env
VITE_API_URL=http://localhost:3001/api
```

### Backend (`backend/.env`)

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="cambia-esto-por-un-secreto-seguro"
PORT=3001
CORS_ORIGIN="http://localhost:5173"

# Opcional — SMTP para email real
EMAIL_HOST=smtp.tuproveedor.com
EMAIL_USER=tu@email.com
EMAIL_PASS=tu_contrasena
EMAIL_FROM="FisioManager <tu@email.com>"
```
