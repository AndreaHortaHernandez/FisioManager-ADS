#!/bin/sh
set -e

echo "→ Aplicando migraciones a la base de datos (prisma migrate deploy)..."
npx prisma migrate deploy

echo "→ Sembrando datos de prueba (upsert idempotente)..."
npm run db:seed || echo "⚠️  Seed falló, continuando de todas formas."

echo "→ Iniciando servidor..."
exec node dist/server.js
