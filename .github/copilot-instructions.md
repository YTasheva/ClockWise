# Copilot Instructions (ClockWise)

## Architecture and data flow
- Frontend is React + Vite; main app wires components in `frontend/src/App.jsx` and uses relative `/api/*` fetches.
- Backend is Express on port 3001 with REST endpoints in `backend/server.js` (projects, tasks, timer, totals, timesheet).
- SQLite is the only persistence layer; schema and helpers live in `backend/database.js`.
- Data model: projects and tasks are many-to-many via `task_projects`; time entries point to tasks only.
- The backend enforces a 4 AM day boundary via `backend/utils.js` (`getTodayDate`, `getCurrentTimeWithBoundary`).
- Starting a timer auto-ends any active entry; entries < 1 minute are discarded (`/api/timer/start`, `/api/timer/end`).
- Totals are computed server-side with SQL group-by queries (`/api/totals`).

## Local database behavior
- Default DB path: `~/Library/Application Support/ClockWise/clockwise.db` with fallback to `backend/data`.
- Override DB location via `CLOCKWISE_DB_DIR` env var.
- `initializeDatabase()` currently drops and recreates all tables on startup (see `backend/database.js`).

## Developer workflows
- Backend dev server: `cd backend && npm run dev` (uses `node --watch`, port 3001).
- Frontend dev server: `cd frontend && npm run dev` (Vite on port 5173; proxies `/api` to 3001 in `frontend/vite.config.js`).
- Frontend build: `cd frontend && npm run build`.
- Tests live under `tests/` and use Vitest imports, but there is no root test script wired up.

## Project conventions and patterns
- API responses are plain JSON with `{ error: message }` on failures (see `backend/server.js`).
- "No Project" is a built-in project (`is_builtin=1`), cannot be renamed or deleted.
- Tasks are global (not scoped to a project); linking happens through `task_projects`.
- UI state refreshes totals by bumping a `refreshKey` and refetching (`frontend/src/App.jsx`, `frontend/src/components/Totals.jsx`).
- Timesheet export pulls both totals and raw entries (`frontend/src/components/TimesheetExport.jsx`).

## Integration points
- Frontend <-> backend: HTTP REST calls to `/api/*` with Vite proxy in dev; no auth layer.
- SQLite queries use helper wrappers `dbRun`, `dbGet`, `dbAll` in `backend/database.js`.
