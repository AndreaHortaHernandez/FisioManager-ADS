#!/bin/sh
set -e

echo "→ Aplicando esquema a la base de datos (prisma db push)..."
npx prisma db push --skip-generate

echo "→ Sembrando datos de prueba (upsert idempotente)..."
npm run db:seed || echo "⚠️  Seed falló, continuando de todas formas."

echo "→ Iniciando servidor..."
exec node dist/server.js
