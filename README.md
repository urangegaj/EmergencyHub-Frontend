# EmergencyHub Frontend

React + TypeScript SPA for the Emergency Hub platform. Talks to the API Gateway (default `http://localhost:5158`).

## Prerequisites

- Node.js 20+
- Running backend stack (Postgres, Redis, AuthService, Gateway, Emergency + department services)
- `.env` copied from `.env.example` with your city and emergency type GUIDs

## Setup

```bash
npm install
cp .env.example .env
# Edit .env — set VITE_API_URL, VITE_DEFAULT_CITY_ID, emergency type IDs
npm run dev
```

Open http://localhost:5173

## Environment

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | API Gateway base URL (e.g. `http://localhost:5158`) |
| `VITE_DEFAULT_CITY_ID` | City GUID for registration |
| `VITE_EMERGENCY_TYPE_*` | Emergency type GUIDs for report form |
| `VITE_NOTIFICATIONS_ENABLED` | `true` when notification API exists (Phase 7) |

In development, Vite proxies `/api` to `VITE_API_URL` so cookies/CORS stay simple.

## Default test user

After backend seed: `admin@emergencyhub.local` / `Admin1234!` (Admin role).

## Roles & routes

| Role | Landing |
|------|---------|
| Citizen | `/` |
| Dispatcher | `/dispatcher` |
| Responder | `/cases` |
| Admin | `/admin` |

## Scripts

- `npm run dev` — development server
- `npm run build` — production build
- `npm run preview` — preview production build

## Architecture notes

- **Auth**: JWT in `localStorage`, refresh queue on 401 (`apiClient.ts`)
- **Polling**: long-poll on emergency detail; assessment report after `Resolved`
- **List API**: supports server-side paging when Gateway returns `{ emergencies, totalCount, page, pageSize }`; falls back to client filter/paginate on plain arrays
- **Dispatcher units**: tries `GET /api/dispatcher/units`, else aggregates fire/police/medical unit endpoints
- **Notifications**: UI scaffold; enable with `VITE_NOTIFICATIONS_ENABLED=true` when backend routes exist

See `FRONTEND_GUIDE.md` for the full product specification.
