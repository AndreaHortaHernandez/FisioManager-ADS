# ── FisioManager API ──────────────────────────────────────────────────────
# Node + Python (Whisper CPU) + ffmpeg en una sola imagen.
FROM node:22-bookworm-slim

WORKDIR /app

# Dependencias del sistema: python3, pip, ffmpeg (para Whisper) y openssl (Prisma).
RUN apt-get update \
 && apt-get install -y --no-install-recommends \
      python3 python3-pip python3-venv ffmpeg openssl ca-certificates \
 && ln -sf /usr/bin/python3 /usr/bin/python \
 && rm -rf /var/lib/apt/lists/*

# Whisper sobre PyTorch CPU-only (mucho más ligero que la build con CUDA).
RUN pip3 install --no-cache-dir --break-system-packages \
      torch --index-url https://download.pytorch.org/whl/cpu \
 && pip3 install --no-cache-dir --break-system-packages openai-whisper \
 # Pre-cachea el modelo "tiny" (~75MB) para que la 1ª transcripción no espere la descarga.
 && python3 -c "import whisper; whisper.load_model('tiny')"

# Dependencias de Node (capa cacheable).
COPY package.json package-lock.json ./
RUN npm ci

# Código fuente + generación de cliente Prisma + build TypeScript.
# CACHEBUST invalida la caché de COPY cuando cambia el código fuente
# (buildah no siempre detecta los cambios de contenido en COPY).
ARG CACHEBUST=0
COPY . .
RUN npx prisma generate \
 && npm run build

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 3001
ENTRYPOINT ["docker-entrypoint.sh"]
