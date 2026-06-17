# FisioManager — Despliegue con Docker / Podman

Todo el proyecto está dockerizado en 3 servicios orquestados por `docker-compose.yml`.
Funciona igual con `docker compose` o `podman-compose`.

## Servicios

| Servicio      | Imagen / build        | Puerto host | Descripción |
|---------------|-----------------------|-------------|-------------|
| `frontend`    | build `./Dockerfile`  | **8080**    | App React (Vite) servida por nginx. Hace de reverse-proxy de `/api` y `/uploads` hacia el backend (mismo origen → sin CORS). |
| `backend`     | build `./backend`     | 3001        | API Express + Prisma (SQLite). Incluye Python + Whisper (CPU) + ffmpeg para transcripción. |
| `ollama`      | `ollama/ollama`       | 11434       | LLM para resúmenes clínicos e insights. |
| `ollama-pull` | `ollama/ollama`       | —           | Job efímero: descarga el modelo en el volumen y termina. |

## Volúmenes persistentes

- `ollama-models` → modelos de Ollama (incluye `gemma4:e2b`, ~7.2 GB).
- `fisio-db`      → base de datos SQLite (`/data/fisio.db`).
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

## Variables configurables (`.env` junto al compose, opcional)

| Variable       | Default                    | Descripción |
|----------------|----------------------------|-------------|
| `JWT_SECRET`   | (inseguro, cámbialo)       | Secreto para firmar tokens JWT. |
| `OLLAMA_MODEL` | `gemma4:e2b`               | Modelo LLM a descargar/usar. |
| `CLINIC_TZ`    | `America/Mexico_City`      | Zona horaria para validar el horario disponible del terapeuta. |
| `FRONTEND_URL` | `http://localhost:8080`    | Base para el enlace de recuperación de contraseña en los correos. |

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

- El backend aplica el esquema (`prisma db push`) y siembra datos (upsert idempotente) en cada arranque.
- La transcripción usa el modelo Whisper `tiny`, pre-cacheado en la imagen.
- PyTorch se instala en versión **CPU-only** para mantener la imagen más ligera; la inferencia de Ollama también corre en CPU dentro del contenedor.
