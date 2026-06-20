# FisioManager — Despliegue con Docker / Podman

Todo el proyecto está dockerizado en servicios orquestados por `docker-compose.yml`.
Funciona igual con `docker compose` o `podman-compose`.

## Servicios

| Servicio      | Imagen / build        | Puerto host | Descripción |
|---------------|-----------------------|-------------|-------------|
| `frontend`    | build `./Dockerfile`  | **8080**    | App React (Vite) servida por nginx. Hace de reverse-proxy de `/api`, `/uploads` y `/socket.io` hacia el backend (mismo origen → sin CORS). |
| `backend`     | build `./backend`     | 3001        | API Express + Prisma (PostgreSQL) + Socket.IO. Incluye Python + Whisper (CPU) + ffmpeg para transcripción. |
| `postgres`    | `postgres:16-alpine`  | —           | Base de datos principal. Healthcheck con `pg_isready`. |
| `db-backup`   | `postgres-backup-local` | —         | `pg_dump` programado con retención (diario por defecto). |
| `ollama`      | `ollama/ollama`       | 11434       | LLM para resúmenes clínicos e insights. |
| `ollama-pull` | `ollama/ollama`       | —           | Job efímero: descarga el modelo en el volumen y termina. |
| `caddy` *(prod)* | `caddy:2-alpine`   | **80/443**  | Solo con `docker-compose.prod.yml`: reverse-proxy con HTTPS automático (Let's Encrypt). |

El backend tiene healthcheck contra `/health/ready` y el frontend espera a que esté sano (`depends_on: condition: service_healthy`).

## Volúmenes persistentes

- `ollama-models` → modelos de Ollama (incluye `gemma4:e2b`, ~7.2 GB).
- `fisio-pgdata`  → datos de PostgreSQL (`/var/lib/postgresql/data`).
- `fisio-backups` → dumps de la base de datos (`db-backup`).
- `fisio-uploads` → audios/vídeos/imágenes subidos.

## Uso

```bash
# Construir y levantar todo (la 1ª vez descarga el modelo de 7.2 GB)
docker compose up -d --build

# Ver estado y logs
docker compose ps
docker compose logs -f backend
docker compose logs -f ollama-pull   # progreso de descarga del modelo

# Detener / eliminar
docker compose down                  # conserva los volúmenes (datos)
docker compose down -v               # elimina también los datos
```

Acceso: **http://localhost:8080**

## Cuentas de prueba (sembradas automáticamente)

| Rol       | Email                      | Password      |
|-----------|----------------------------|---------------|
| Admin     | admin@fisiomanager.com     | admin123      |
| Terapeuta | sarah@fisiomanager.com     | therapist123  |
| Paciente  | michael@fisiomanager.com   | patient123    |
| Paciente  | elena@fisiomanager.com     | patient123    |

## Variables configurables (`.env` junto al compose)

Copia `.env.example` a `.env` y rellena los valores. Principales:

| Variable             | Default                  | Descripción |
|----------------------|--------------------------|-------------|
| `JWT_SECRET`         | (inseguro, cámbialo)     | Secreto para firmar tokens JWT. **Obligatorio ≥ 32 chars en producción.** |
| `POSTGRES_PASSWORD`  | `fisio`                  | Contraseña de PostgreSQL (cámbiala en producción). |
| `CORS_ORIGIN`        | `http://localhost:8080`  | Dominio del frontend permitido. |
| `FRONTEND_URL`       | `http://localhost:8080`  | Base para enlaces de recuperación de contraseña. |
| `DOMAIN` / `ACME_EMAIL` | —                     | Dominio y correo para HTTPS automático (override de prod). |
| `SENTRY_DSN`         | (vacío)                  | Si se define, envía errores a Sentry. |
| `EMAIL_HOST` …       | (vacío)                  | SMTP real; vacío = correos de prueba (no se envían). |
| `OLLAMA_MODEL`       | `gemma4:e2b`             | Modelo LLM a descargar/usar. |
| `BACKUP_SCHEDULE`    | `@daily`                 | Frecuencia de los backups de la BD. |

## Producción (HTTPS)

```bash
# 1. Define DOMAIN, ACME_EMAIL y secretos en .env. Apunta el DNS al servidor.
# 2. Levanta con el override que añade Caddy (HTTPS automático):
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

Caddy obtiene y renueva los certificados TLS por sí solo. Asegúrate de abrir los puertos 80 y 443.

El override de producción también levanta **Redis** (escalado horizontal de Socket.IO: mensajería/notificaciones consistentes entre varias instancias del backend) y **MinIO** (object storage S3 para los uploads, en vez del disco local). Define `S3_PUBLIC_URL` con una URL del bucket alcanzable desde el navegador (p. ej. expón MinIO tras tu dominio). El audio de las notas de voz se mantiene en disco local porque Whisper lo procesa localmente.

## Recursos y endurecimiento

- Cada servicio define `deploy.resources.limits` (CPU/memoria) en el compose; ajústalos a tu host. **Docker Compose v2** los respeta; `podman-compose` los ignora (limita con flags del runtime).
- El contenedor del **backend corre como usuario no-root** (`node`). El frontend usa `nginx:alpine` (workers no-root); para nginx 100% sin privilegios puedes cambiar a `nginxinc/nginx-unprivileged`.

## Backups y restauración

Los dumps se generan automáticamente en el volumen `fisio-backups`. Para restaurar:

```bash
# Listar backups
docker compose exec db-backup ls /backups/last
# Restaurar uno (ejemplo)
docker compose exec -T postgres psql -U fisio -d fisiomanager < /ruta/al/backup.sql
```

## Reconstruir tras cambios de código

`podman`/`buildah` a veces **cachea la capa `COPY` sin detectar cambios** en el
código. Si tras un cambio los contenedores siguen con la versión anterior:

```bash
# Backend (evita reinstalar PyTorch usando CACHEBUST):
podman build --build-arg CACHEBUST=$(date +%s) -t localhost/fsiomanager_backend:latest ./backend
# Recrea los contenedores desde las imágenes nuevas:
docker compose down && docker compose up -d
```

## Notas

- El backend aplica las **migraciones** (`prisma migrate deploy`) y siembra datos (upsert idempotente) en cada arranque, una vez que PostgreSQL reporta estar sano.
- La transcripción usa el modelo Whisper `tiny`, pre-cacheado en la imagen.
- PyTorch se instala en versión **CPU-only** para mantener la imagen más ligera; la inferencia de Ollama también corre en CPU dentro del contenedor.
