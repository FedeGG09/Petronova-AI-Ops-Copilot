# AESA Copilot 4x4

Demo de producto para innovación en AESA / YPF con enfoque en operación industrial, supply chain, contratos y mantenimiento. El repo está preparado para subir a GitHub y desplegar el front en Cloudflare Pages y la API en Cloudflare Workers + D1.

## Estructura

- `apps/api`: Worker en TypeScript con D1, router de intención, agentes, riesgo y trazabilidad.
- `apps/web`: Frontend en React + Vite con landing, agentes, chat, paneles y logs.
- `services/ml-api`: Servicio opcional en FastAPI para sustituir el motor de riesgo por un modelo ML real más adelante.

## Arranque local

### API
```bash
cd apps/api
npx wrangler d1 execute aesa_copilot_db --local --file=./schema.sql
npm install
npm run dev
```

### Web
```bash
cd apps/web
npm install
npm run dev
```

## Cloudflare

### Worker
En `apps/api/wrangler.toml` completá el `database_id` real de D1 y desplegá:

```bash
npm --workspace apps/api run deploy
```

### Pages
Desplegá `apps/web` en Cloudflare Pages. Para producción, configurá:

- `VITE_API_BASE_URL` si el Worker vive en otro dominio.
- Si el frontend y el Worker comparten dominio, el frontend usa `/api/chat`.

## Agentes incluidos

- Supply
- Maintenance
- Contracts
- General

## Qué muestra la demo

- landing de bienvenida,
- selector visual de agentes,
- chat con respuestas preprogramadas,
- score de riesgo,
- contratos,
- documentos,
- actividad / trazabilidad,
- arquitectura Cloudflare-ready.

## Servicio ML opcional

`services/ml-api` incluye un ejemplo con FastAPI para cuando quieras reemplazar el motor de riesgo por un modelo real entrenado con joblib/sklearn.
