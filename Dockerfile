# ── FisioManager Web (frontend) ───────────────────────────────────────────
# Etapa 1: build estático con Vite.
FROM node:22-bookworm-slim AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# CACHEBUST invalida la caché de COPY cuando cambia el código (bug de buildah).
ARG CACHEBUST=0
COPY . .

# La app llama al backend con rutas relativas (/api, /uploads); nginx las proxea.
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Etapa 2: servir con nginx + reverse-proxy al backend.
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
