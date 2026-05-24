# Emergency Hub — Frontend Execution Guide

This document is the complete implementation guide for the Emergency Hub frontend. The backend is fully built and running. Your job is to build the React app that talks to it. Follow the phases in order — each phase produces a working vertical slice before you move on.

---

## Tech Stack

- **Vite + React + TypeScript**
- **react-router-dom v6** for routing
- **Tailwind CSS** for styling
- **Axios** for HTTP (you need its interceptor system)
- **Context API** (no Redux — the architecture doc specifies Context)

---

## Folder Structure

```
src/
├── contexts/         # AuthContext, EmergencyContext, NotificationContext
├── hooks/            # useEmergencyPoll, useAssessmentPoll, useAuth, etc.
├── pages/            # One file per page/route
├── components/       # Reusable UI components
├── services/         # Axios instance + typed API wrappers per domain
├── types/            # TypeScript interfaces matching API response shapes
└── main.tsx
```

---

## Phase 1 — Project Setup

### Step 1: Scaffold the project

```bash
cd EmergencyHub-Frontend
npm create vite@latest . -- --template react-ts
npm install
npm install react-router-dom axios
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

Configure `tailwind.config.js`:
```js
content: ["./index.html", "./src/**/*.{ts,tsx}"]
```

Add to `src/index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### Step 2: Define TypeScript types

Create `src/types/index.ts`. These match the exact shapes the backend returns:

```ts
export type Role = "Citizen" | "Dispatcher" | "Responder" | "Admin";
export type Department = "FIRE" | "POLICE" | "MEDICAL";
export type EmergencyStatus = "REPORTED" | "DISPATCHED" | "IN_PROGRESS" | "RESOLVED" | "CANCELLED";
export type CaseStatus = "OPEN" | "IN_PROGRESS" | "CLOSED";
export type UnitStatus = "AVAILABLE" | "BUSY" | "OFFLINE";
export type ReportStatus = "PENDING" | "COMPLETED" | "FAILED";

export interface AuthUser {
  userId: string;
  cityId: string;
  role: Role;
  department?: Department;
}

export interface LoginResponse extends AuthUser {
  accessToken: string;
  refreshToken: string;
}

export interface Emergency {
  id: string;
  cityId: string;
  reportedByUserId: string;
  status: EmergencyStatus;
  version: number;
  description: string;
  address: string;
  createdAt: string;
  resolvedAt?: string;
  emergencyType: { id: string; name: string };
  assignments: EmergencyAssignment[];
  statusHistory: StatusHistoryEntry[];
}

export interface EmergencyAssignment {
  id: string;
  emergencyId: string;
  departmentType: Department;
  assignedAt: string;
  closedAt?: string;
}

export interface StatusHistoryEntry {
  status: EmergencyStatus;
  changedAt: string;
  changedBy: string;
}

export interface EmergencyListResponse {
  emergencies: Emergency[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface DepartmentCase {
  id: string;
  emergencyId: string;
  cityId: string;
  status: CaseStatus;
  notes?: string;
  openedAt: string;
  closedAt?: string;
}

export interface Unit {
  id: string;
  cityId: string;
  name: string;
  vehiclePlate: string;
  status: UnitStatus;
}

export interface AssessmentReport {
  id: string;
  emergencyId: string;
  status: ReportStatus;
  openaiResponse?: string;
  responseRating?: number;
  lastError?: string;
  generatedAt?: string;
  retryCount: number;
}

export interface DispatcherUnitsResponse {
  police: Unit[];
  fire: Unit[];
  medical: Unit[];
}

export interface AdminUser {
  userId: string;
  email: string;
  role: Role;
  department?: Department;
  firstName: string;
  lastName: string;
  phone?: string;
  cityId: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
}
```

### Step 3: Create the Axios instance

Create `src/services/apiClient.ts`:

```ts
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

export const apiClient = axios.create({ baseURL: BASE_URL });

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let isRefreshing = false;
let pendingQueue: Array<{ resolve: (v: string) => void; reject: (e: unknown) => void }> = [];

apiClient.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    if (err.response?.status !== 401 || original._retry) return Promise.reject(err);

    original._retry = true;

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({ resolve, reject });
      }).then((token) => {
        original.headers.Authorization = `Bearer ${token}`;
        return apiClient(original);
      });
    }

    isRefreshing = true;
    try {
      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) throw new Error("No refresh token");

      const { data } = await axios.post(`${BASE_URL}/api/auth/refresh`, { refreshToken });
      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);

      pendingQueue.forEach((p) => p.resolve(data.accessToken));
      pendingQueue = [];

      original.headers.Authorization = `Bearer ${data.accessToken}`;
      return apiClient(original);
    } catch (refreshErr) {
      pendingQueue.forEach((p) => p.reject(refreshErr));
      pendingQueue = [];
      localStorage.clear();
      window.location.href = "/login";
      return Promise.reject(refreshErr);
    } finally {
      isRefreshing = false;
    }
  }
);
```

**Why the queue:** If two requests fail with 401 simultaneously, only one refresh call should happen. The pending queue holds the other requests until the token is renewed, then replays them all.

### Step 4: Create typed service wrappers

Create one file per domain in `src/services/`. These are thin wrappers — they call `apiClient` and return typed responses. No business logic here.

**`src/services/authService.ts`**
```ts
import { apiClient } from "./apiClient";
import type { LoginResponse, AuthUser } from "../types";

export const authService = {
  register: (body: {
    email: string; password: string; role: string;
    firstName: string; lastName: string; cityId: string;
    department?: string; phone?: string;
  }) => apiClient.post<{ userId: string }>("/api/auth/register", body),

  login: (email: string, password: string) =>
    apiClient.post<LoginResponse>("/api/auth/login", { email, password }),

  logout: (refreshToken: string) =>
    apiClient.post("/api/auth/logout", { refreshToken }),

  me: () => apiClient.get<AuthUser>("/api/me"),
};
```

**`src/services/emergencyService.ts`**
```ts
import { apiClient } from "./apiClient";
import type { Emergency, EmergencyListResponse } from "../types";

export const emergencyService = {
  create: (body: { emergencyTypeId: string; description: string; address: string }) =>
    apiClient.post<Emergency>("/api/emergencies", body),

  get: (id: string) =>
    apiClient.get<Emergency>(`/api/emergencies/${id}`),

  list: (params?: {
    status?: string; typeName?: string; fromTs?: number; toTs?: number;
    q?: string; page?: number; pageSize?: number; sortBy?: string; order?: string;
  }) => apiClient.get<EmergencyListResponse>("/api/emergencies", { params }),

  poll: (id: string, since: number, timeout = 30, signal?: AbortSignal) =>
    apiClient.get<Emergency>(`/api/emergencies/${id}/poll`, {
      params: { since, timeout },
      signal,
    }),

  assign: (id: string, departments: string[]) =>
    apiClient.post(`/api/emergencies/${id}/assign`, { departments }),
};
```

**`src/services/assessmentService.ts`**
```ts
import { apiClient } from "./apiClient";
import type { AssessmentReport } from "../types";

export const assessmentService = {
  get: (emergencyId: string) =>
    apiClient.get<AssessmentReport>(`/api/assessments/${emergencyId}`),

  retry: (emergencyId: string) =>
    apiClient.post<AssessmentReport>(`/api/assessments/${emergencyId}/retry`),
};
```

**`src/services/departmentService.ts`**
```ts
import { apiClient } from "./apiClient";
import type { DepartmentCase, Unit, DispatcherUnitsResponse } from "../types";

type Dept = "fire" | "police" | "medical";

export const departmentService = {
  getCases: (dept: Dept, status?: string) =>
    apiClient.get<DepartmentCase[]>(`/api/${dept}/cases`, { params: status ? { status } : undefined }),

  getCase: (dept: Dept, emergencyId: string) =>
    apiClient.get<DepartmentCase>(`/api/${dept}/cases/${emergencyId}`),

  updateCase: (dept: Dept, emergencyId: string, body: { status: string; unitId?: string }) =>
    apiClient.put<DepartmentCase>(`/api/${dept}/cases/${emergencyId}`, body),

  getUnits: (dept: Dept) =>
    apiClient.get<Unit[]>(`/api/${dept}/units`),

  updateUnitStatus: (dept: Dept, unitId: string, status: string) =>
    apiClient.put(`/api/${dept}/units/${unitId}/status`, { status }),

  getDispatcherUnits: () =>
    apiClient.get<DispatcherUnitsResponse>("/api/dispatcher/units"),
};
```

**`src/services/adminService.ts`**
```ts
import { apiClient } from "./apiClient";
import type { AdminUser } from "../types";

export const adminService = {
  listUsers: (params?: { role?: string; department?: string; page?: number; pageSize?: number }) =>
    apiClient.get<{ users: AdminUser[]; totalCount: number }>("/api/admin/users", { params }),

  createUser: (body: {
    email: string; password: string; role: string;
    firstName: string; lastName: string; department?: string; phone?: string;
  }) => apiClient.post<{ userId: string }>("/api/admin/users", body),

  updateUser: (id: string, body: { firstName?: string; lastName?: string; phone?: string; department?: string }) =>
    apiClient.patch(`/api/admin/users/${id}`, body),

  deleteUser: (id: string) =>
    apiClient.delete(`/api/admin/users/${id}`),

  assignRole: (id: string, role: string, department?: string) =>
    apiClient.patch(`/api/admin/users/${id}/role`, { role, department }),
};
```

> **Note on notifications:** The notification REST routes (`GET /api/notifications`, `PATCH /api/notifications/{id}/read`) have not yet been implemented on the backend. Hold off on `notificationService.ts` until the backend team wires those routes. The `NotificationContext` and UI (Phase 5) can be scaffolded but should be gated behind a feature flag or left as a stub until those routes exist.

---

## Phase 2 — Authentication

### Step 5: AuthContext

Create `src/contexts/AuthContext.tsx`:

```tsx
import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { authService } from "../services/authService";
import type { AuthUser, LoginResponse } from "../types";

interface AuthContextValue {
  user: AuthUser | null;
  accessToken: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(
    () => localStorage.getItem("accessToken")
  );

  useEffect(() => {
    if (!accessToken) return;
    authService.me()
      .then((res) => setUser(res.data))
      .catch(() => {
        localStorage.clear();
        setAccessToken(null);
      });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await authService.login(email, password);
    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("refreshToken", data.refreshToken);
    setAccessToken(data.accessToken);
    setUser({ userId: data.userId, cityId: data.cityId, role: data.role, department: data.department });
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem("refreshToken");
    if (refreshToken) await authService.logout(refreshToken).catch(() => {});
    localStorage.clear();
    setAccessToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, accessToken, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
```

**Token storage:** `accessToken` and `refreshToken` live in `localStorage`. The Axios interceptor reads them directly from `localStorage` — it does not depend on React state, so it works even before the component tree re-renders.

### Step 6: Router setup with route guards

Create `src/components/RequireAuth.tsx`:

```tsx
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import type { Role } from "../types";

interface Props {
  children: React.ReactNode;
  allowedRoles?: Role[];
}

export function RequireAuth({ children, allowedRoles }: Props) {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;
  if (allowedRoles && user && !allowedRoles.includes(user.role))
    return <Navigate to="/unauthorized" replace />;

  return <>{children}</>;
}
```

Wire up routes in `src/main.tsx` (or a dedicated `AppRouter.tsx`):

```tsx
<BrowserRouter>
  <AuthProvider>
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route path="/" element={<RequireAuth><DashboardPage /></RequireAuth>} />
      <Route path="/emergencies/report" element={<RequireAuth allowedRoles={["Citizen"]}><ReportEmergencyPage /></RequireAuth>} />
      <Route path="/emergencies/:id" element={<RequireAuth><EmergencyDetailPage /></RequireAuth>} />
      <Route path="/dispatcher" element={<RequireAuth allowedRoles={["Dispatcher"]}><DispatcherBoardPage /></RequireAuth>} />
      <Route path="/cases" element={<RequireAuth allowedRoles={["Responder"]}><DepartmentCasesPage /></RequireAuth>} />
      <Route path="/admin" element={<RequireAuth allowedRoles={["Admin"]}><AdminPanelPage /></RequireAuth>} />

      <Route path="/unauthorized" element={<div>Access denied.</div>} />
    </Routes>
  </AuthProvider>
</BrowserRouter>
```

After login, redirect to the correct landing page based on role:

| Role | Landing page |
|---|---|
| Citizen | `/` (Dashboard — shows their emergencies) |
| Dispatcher | `/dispatcher` |
| Responder | `/cases` |
| Admin | `/admin` |

### Step 7: Login page

`src/pages/LoginPage.tsx`:

- Form with `email` and `password` fields
- On submit: call `login(email, password)` from `AuthContext`
- On success: redirect based on `user.role` (see table above)
- On error: display the error message from the API (the backend returns plain strings)
- Link to `/register`

### Step 8: Register pages

The register endpoint accepts different fields depending on role. Build a single `RegisterPage` with conditional rendering:

```
POST /api/auth/register
Body: { email, password, role, firstName, lastName, cityId, department?, phone? }
Response: { userId: string }
```

- **Citizen registration:** role = `"Citizen"`, no department field. Show a `cityId` selector (you need a list of cities — for now, hardcode the seeded city's ID or fetch it from `/api/me` after login to show city info). The simplest approach is to have the cityId be an env variable (`VITE_DEFAULT_CITY_ID`) during development.
- **Responder registration:** role = `"Responder"`, show a `department` dropdown with values `FIRE`, `POLICE`, `MEDICAL`.
- Use a toggle/tab to switch between Citizen and Responder registration modes.
- On success: redirect to `/login` with a success message.

> **Note on city ID:** The backend is multi-tenant. Cities are created via DB seed/migrations, not via the API. For local dev, the seeded default city ID is whatever was inserted at migration time. Ask the backend team to expose it (e.g. an env var or a `GET /api/cities` public endpoint if they add one). For now, treat it as `VITE_DEFAULT_CITY_ID` in your `.env`.

---

## Phase 3 — Emergency Reporting & Detail

### Step 9: EmergencyContext and long-polling hook

The long-polling loop is the most complex piece of state in this app. Understand it before implementing:

1. Client calls `GET /api/emergencies/{id}/poll?since={version}&timeout=30`
2. The server **holds the connection open** until either:
   - The emergency's version increments (a status change occurred), or
   - 30 seconds elapse (timeout)
3. Either way, the server responds with the current emergency object
4. The client immediately fires the next poll with the new `version` as `since`
5. This loop runs continuously until the emergency reaches a terminal state (`RESOLVED` or `CANCELLED`)
6. On terminal state: stop polling emergency, start polling assessment (only for `RESOLVED`)

Create `src/hooks/useEmergencyPoll.ts`:

```ts
import { useState, useEffect, useRef, useCallback } from "react";
import { emergencyService } from "../services/emergencyService";
import type { Emergency } from "../types";

const TERMINAL = ["RESOLVED", "CANCELLED"];

export function useEmergencyPoll(emergencyId: string | undefined) {
  const [emergency, setEmergency] = useState<Emergency | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const activeRef = useRef(false);

  const stop = useCallback(() => {
    activeRef.current = false;
    abortRef.current?.abort();
  }, []);

  useEffect(() => {
    if (!emergencyId) return;
    activeRef.current = true;

    const run = async () => {
      let since = 0;

      // Initial fetch to get current state
      try {
        const { data } = await emergencyService.get(emergencyId);
        setEmergency(data);
        since = data.version;
        if (TERMINAL.includes(data.status)) { stop(); return; }
      } catch (e: any) {
        setError(e.message);
        return;
      }

      // Long-poll loop
      while (activeRef.current) {
        abortRef.current = new AbortController();
        try {
          const { data } = await emergencyService.poll(emergencyId, since, 30, abortRef.current.signal);
          if (!activeRef.current) break;
          setEmergency(data);
          since = data.version;
          if (TERMINAL.includes(data.status)) { stop(); break; }
        } catch (e: any) {
          if (e.name === "CanceledError" || e.name === "AbortError") break;
          // On transient network error: wait briefly and retry
          await new Promise((r) => setTimeout(r, 2000));
        }
      }
    };

    run();
    return () => stop();
  }, [emergencyId]);

  return { emergency, error, stop };
}
```

Create `src/hooks/useAssessmentPoll.ts`:

```ts
import { useState, useEffect, useRef } from "react";
import { assessmentService } from "../services/assessmentService";
import type { AssessmentReport, EmergencyStatus } from "../types";

export function useAssessmentPoll(emergencyId: string | undefined, emergencyStatus: EmergencyStatus | undefined) {
  const [report, setReport] = useState<AssessmentReport | null>(null);
  const activeRef = useRef(false);

  useEffect(() => {
    if (!emergencyId || emergencyStatus !== "RESOLVED") return;
    activeRef.current = true;

    const poll = async () => {
      while (activeRef.current) {
        try {
          const { data } = await assessmentService.get(emergencyId);
          setReport(data);
          if (data.status === "COMPLETED" || data.status === "FAILED") break;
        } catch {
          // 404 means report not generated yet, keep polling
        }
        await new Promise((r) => setTimeout(r, 3000));
      }
    };

    poll();
    return () => { activeRef.current = false; };
  }, [emergencyId, emergencyStatus]);

  return { report, setReport };
}
```

**Assessment poll interval:** 3 seconds is fine. The report is AI-generated and typically takes 5–20 seconds. Stop polling as soon as you get `COMPLETED` or `FAILED`.

### Step 10: Report Emergency page

`src/pages/ReportEmergencyPage.tsx` — accessible to `Citizen` only.

Form fields:
- `emergencyTypeId` — dropdown, hardcode the four seeded types: `FIRE`, `MEDICAL`, `CRIME`, `OTHER`. You'll need their IDs. Ask the backend team for the seeded IDs or add a `GET /api/emergency-types` endpoint. For now a static map works: `{ FIRE: "...", MEDICAL: "...", CRIME: "...", OTHER: "..." }` configured via env.
- `description` — textarea, required
- `address` — text input, required

```
POST /api/emergencies
Body: { emergencyTypeId, description, address }
Response: Emergency object
```

On success: navigate to `/emergencies/{id}`.

### Step 11: Emergency Detail page

`src/pages/EmergencyDetailPage.tsx` — accessible to all authenticated users.

This page is the heart of the citizen experience. Use `useEmergencyPoll` and `useAssessmentPoll` here.

**Layout:**

```
┌─────────────────────────────────────────┐
│  Emergency #{id}                        │
│  Status: [badge]    Type: FIRE          │
│  Address: ...       Reported: [date]    │
├─────────────────────────────────────────┤
│  Status History                         │
│  [timeline of status changes]           │
├─────────────────────────────────────────┤
│  Assigned Departments                   │
│  FIRE • MEDICAL                         │
├─────────────────────────────────────────┤
│  Assessment Report  ← only if RESOLVED  │
│  [ReportPanel component]                │
└─────────────────────────────────────────┘
```

**State logic:**
- While `emergency.status` is not terminal: show a "Live" indicator (spinning dot or similar)
- When status is `CANCELLED`: show a grey "Cancelled" banner, hide report section entirely
- When status is `RESOLVED`: show green "Resolved" banner, render `<ReportPanel>`

### Step 12: ReportPanel component

`src/components/ReportPanel.tsx` — receives `emergencyId` and `emergencyStatus` as props, calls `useAssessmentPoll` internally.

| Report status | What to show |
|---|---|
| No report yet / polling | Spinner + "Generating assessment report..." |
| `PENDING` | Spinner + "Generating assessment report..." |
| `COMPLETED` | Report text rendered as markdown (or preformatted), rating badge |
| `FAILED` | Error message + "Retry" button |

The Retry button calls `POST /api/assessments/{emergencyId}/retry`, then resets the report to `PENDING` state locally and resumes polling.

---

## Phase 4 — Dispatcher Board

### Step 13: Dispatcher Board page

`src/pages/DispatcherBoardPage.tsx` — accessible to `Dispatcher` only.

**Features:**
1. List of all active emergencies in the city (paginated)
2. Filter bar: status, type, date range, free-text search
3. Assign action (multi-department select per emergency)
4. Unit availability widget (refreshed periodically)

**Fetching emergencies:**

```
GET /api/emergencies?status=REPORTED&page=1&pageSize=20&sortBy=created_at&order=desc
```

Use all the filter params: `status`, `typeName`, `fromTs`, `toTs`, `q`, `page`, `pageSize`, `sortBy`, `order`. `fromTs`/`toTs` are Unix timestamps in milliseconds.

**Emergency list item** should show: type, address, description (truncated), status badge, reported time, number of assigned departments.

**Assign flow:**

Each emergency row has an "Assign" button (only shown if status is `REPORTED`). On click, open a modal or inline panel:

```
POST /api/emergencies/{id}/assign
Body: { departments: ["FIRE", "MEDICAL"] }  ← array, can be multiple
```

- Show checkboxes for FIRE, POLICE, MEDICAL
- At least one must be selected (the backend enforces this too)
- On success, the row's status should update to `DISPATCHED`

**Cancel flow:**

Show a "Cancel" button on any non-terminal emergency. This requires a backend route that does not exist yet — see the note below.

> **Backend gap:** There is no `POST /api/emergencies/{id}/cancel` route currently. The backend team needs to add it. Flag this to them. For now, the Cancel button can be shown as disabled with a tooltip "Coming soon."

**Unit availability widget:**

```
GET /api/dispatcher/units
Response: { police: Unit[], fire: Unit[], medical: Unit[] }
```

Show counts per department: how many units are `AVAILABLE` vs `BUSY` vs `OFFLINE`. Refresh this every 30 seconds with a `setInterval` (clear it on unmount).

---

## Phase 5 — Department Case Pages

### Step 14: Department Cases page (Responder view)

`src/pages/DepartmentCasesPage.tsx` — accessible to `Responder` only.

The department is read from `user.department` (in `AuthContext`). Map it to the lowercase service name:

```ts
const dept = user.department!.toLowerCase() as "fire" | "police" | "medical";
```

**Cases list:**

```
GET /api/{dept}/cases?status=OPEN
```

Show a tab bar: OPEN / IN_PROGRESS / CLOSED. Switching tabs re-fetches with the corresponding `status` filter.

**Case row** shows: emergency address and description (you'll need to fetch the emergency separately via `GET /api/emergencies/{id}` or show just the emergency ID), current case status, opened time.

**Case detail / update:**

Click on a case → expand inline or navigate to a detail view showing:
- Current status
- A "Update Status" dropdown: `OPEN → IN_PROGRESS → CLOSED`
- Optional unit selector (list from `GET /api/{dept}/units`)

```
PUT /api/{dept}/cases/{emergencyId}
Body: { status: "IN_PROGRESS", unitId?: "..." }
```

**Status transition rules (enforce on the frontend):**
- `OPEN` can go to `IN_PROGRESS` or `CLOSED`
- `IN_PROGRESS` can go to `CLOSED`
- `CLOSED` is terminal — no further updates

**Unit management panel:**

Add a "Units" tab or section on the cases page showing the department's units:

```
GET /api/{dept}/units
```

Each unit shows its name, vehicle plate, and status badge. Allow the responder to toggle their own unit's status:

```
PUT /api/{dept}/units/{unitId}/status
Body: { status: "AVAILABLE" | "BUSY" | "OFFLINE" }
```

---

## Phase 6 — Admin Panel

### Step 15: Admin Panel

`src/pages/AdminPanelPage.tsx` — accessible to `Admin` only.

Two sections: **User list** and **Create user**.

**User list:**

```
GET /api/admin/users?role=&department=&page=1&pageSize=20
```

Show a table with columns: Name, Email, Role, Department, Actions.

Filter controls: role dropdown, department dropdown.

Actions per row:
- **Edit** — inline form or modal to update `firstName`, `lastName`, `phone`, `department`
  ```
  PATCH /api/admin/users/{id}
  Body: { firstName?, lastName?, phone?, department? }
  ```
- **Change role** — separate action (role changes are sensitive)
  ```
  PATCH /api/admin/users/{id}/role
  Body: { role, department? }
  ```
  When changing to `Responder`, show the department dropdown.
- **Deactivate** — soft delete (user is deactivated, not removed from DB)
  ```
  DELETE /api/admin/users/{id}
  ```
  Show a confirmation dialog before submitting.

**Create user form:**

```
POST /api/admin/users
Body: { email, password, role, firstName, lastName, department?, phone? }
```

- Role dropdown with all four roles
- Department dropdown appears when role is `Responder`
- On success: reload the user list

---

## Phase 7 — Notifications

> **Wait for backend first.** The notification REST routes are not yet implemented. Once the backend team adds them, implement this phase.

Expected endpoints:
- `GET /api/notifications` → `Notification[]`
- `PATCH /api/notifications/{id}/read`

### Step 16: NotificationContext

`src/contexts/NotificationContext.tsx`:

- On mount (for authenticated users): poll `GET /api/notifications` every 30 seconds
- Expose: `notifications`, `unreadCount`, `markRead(id)`
- `markRead` calls `PATCH /api/notifications/{id}/read` and updates local state optimistically

### Step 17: Notification UI

- Add a bell icon to the page header/navbar with a red badge showing `unreadCount`
- On click: open a dropdown listing recent notifications, each with message, time, and a read indicator
- Clicking a notification: mark it as read and (if it references an emergency) navigate to `/emergencies/{id}`

---

## Phase 8 — Search & Filters (Dispatcher Board Enhancement)

The `GET /api/emergencies` endpoint already supports all filter parameters. This phase is about wiring the full filter UI.

**Filter bar components:**

| Filter | UI element | Param |
|---|---|---|
| Status | Multi-select dropdown | `status` (one value for now — the backend currently accepts a single value) |
| Emergency type | Dropdown: FIRE, MEDICAL, CRIME, OTHER | `typeName` |
| Date range | Two date pickers | `fromTs`, `toTs` (Unix ms) |
| Free text | Search input with debounce (300ms) | `q` |
| Sort | Dropdown: Created (newest/oldest), Status | `sortBy`, `order` |
| Page size | Dropdown: 10, 20, 50 | `pageSize` |

Store all filter state in a single `useReducer` or `useState` object. Re-fetch on every change. Include a "Clear filters" button.

---

## Implementation Order (Critical Path)

Build in this exact order to have a working demo as early as possible:

1. Project setup (Phase 1)
2. Axios client + AuthContext (Phases 1–2)
3. Login + Register pages (Phase 2)
4. Report Emergency page + Emergency Detail page with long polling (Phase 3) — this is the core citizen flow
5. Dispatcher Board — emergency list + assign action (Phase 4, no filters yet)
6. Department Cases page — list + update status (Phase 5)
7. Assessment report panel (Phase 3, Step 12) — works automatically once emergencies reach RESOLVED
8. Admin Panel (Phase 6)
9. Filter bar on Dispatcher Board (Phase 8)
10. Notifications (Phase 7) — blocked on backend

---

## Environment Variables

Create `.env` and `.env.example` at the frontend root:

```
VITE_API_URL=http://localhost:5000
VITE_DEFAULT_CITY_ID=<ask backend team for the seeded city GUID>
```

---

## Running the Full Stack Locally

The backend requires Docker Compose to run (Kafka, Postgres, Redis, Debezium, all services). Ask the backend team to confirm the exact startup sequence and what port the Gateway runs on. The Gateway is the only service the frontend talks to.

```bash
# In EmergencyHub-Backend
docker-compose up -d

# In EmergencyHub-Frontend
npm run dev
```

Swagger is available at `http://localhost:<gateway_port>/swagger` in development. Use it to verify request/response shapes against what you build.

---

## Key Behaviours to Get Right

**Long polling:** The connection is held open server-side for up to 30 seconds. Do not add your own client-side timeout shorter than 30s. The `AbortController` is used only for explicit cancellation (component unmount, navigation away). Always reconnect immediately on a valid response — do not add a delay between polls.

**Terminal state detection:** Check `emergency.status` on every poll response. Stop the polling loop the moment you see `RESOLVED` or `CANCELLED`. Never poll a terminal emergency — the backend will return the same version forever.

**Assessment polling starts only on RESOLVED:** If the emergency is `CANCELLED`, no report exists and no report should be fetched or displayed.

**401 handling:** The interceptor handles token refresh automatically. Individual API calls do not need to handle 401 — if the interceptor gives up (refresh token also expired), it redirects to `/login`. Make sure you do not wrap every call in redundant 401 handling.

**City ID is always server-side:** Never send `cityId` as a filter or body parameter to the API (except at registration). The server reads it from the JWT and enforces it on every query. Any `cityId` param you pass will be ignored.

**Department-gated routes:** The backend checks both `role == Responder` and `department == FIRE/POLICE/MEDICAL` on department routes. Sending a Fire responder to `GET /api/police/cases` will return a 403. Your routing and API calls must match the user's actual department from `user.department`.
