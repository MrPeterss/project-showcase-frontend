# Application entry (`src/` root)

## Purpose

The files at [`src/`](../src/) root bootstrap the SPA: **`main.tsx`** mounts React in strict mode and loads global styles; **`App.tsx`** wires the Redux `Provider`, error boundary, `BrowserRouter`, and the full route tree with shared chrome (`GlobalHeader`, conditional `NavBar`). CSS alongside the shell lives in **`App.css`** and **`index.css`**.

## Key files

| File | Role |
|------|------|
| [`main.tsx`](../src/main.tsx) | `createRoot` + `StrictMode`; entry import for `App` and `index.css` |
| [`App.tsx`](../src/App.tsx) | Redux provider, routes, layout rules for header vs legacy nav bar |
| [`App.css`](../src/App.css) | Global app styling |
| [`index.css`](../src/index.css) | Tailwind / design tokens baseline |

### Routing highlights (`App.tsx`)

- **`/`** → redirect to **`/login`**
- **`/login`** → `LoginCard`
- **`/courses`** → course catalog (`pages/Courses`)
- **`/courses/:offeringId`** → **`CourseLayout`** wrapper with nested routes:
  - index → `CourseProjects`
  - `dashboard` → `CourseDashboard`
  - `dashboard/:teamId` → `CourseTeamDashboard`
  - `settings` → `CourseSettings`
  - `spark` → `CourseSpark`
- **`/dashboard/:teamId`** → standalone `Dashboard` (no course shell)
- **`/admin`** → global `Admin`
- **`/not-found/:team_name`** → deploy-facing `ProjectNotFound`
- **`*`** → generic `NotFound`

`shouldShowNav` hides the legacy `NavBar` on login, `/courses`, all `/courses/...`, `/dashboard/...`, `/admin`, and `/not-found/...`; **`GlobalHeader`** still renders everywhere except paths it chooses to omit internally (login). See [`components.md`](components.md).

## Architecture

- **State:** entire tree under `<Provider store={store}>`. See [`store.md`](store.md).
- **Pages & layout:** routed components under [`pages/`](pages.md); course subtree uses [`CourseLayout`](../src/components/CourseLayout.tsx). See [`components.md`](components.md).
- **Auth:** Firebase + `useAuth` on components that need it; see [`hooks.md`](hooks.md).

### Caveats documented elsewhere

- **`ProtectedRoute`** in [`ProtectedRoute.tsx`](../src/components/ProtectedRoute.tsx) exists for auth-aware wrappers but **is not used** in the current `App.tsx` route declarations; login/dashboard behavior is enforced per-page or via helpers.
- **`pages/Projects.tsx`** is **not routed** today; **`NavBar`** still links to `/projects`, which will fall through to the catch-all `NotFound`.

## How to develop here

1. **Add a route** — register `<Route>` in `App.tsx`. Course-scoped pages should nest under **`/courses/:offeringId`** beneath `CourseLayout` when they need offering context from the shell.
2. **Adjust chrome** — if a new section should hide `NavBar` or change header behavior, update `isValidRoute` / `shouldShowNav` in `App.tsx` together with [`GlobalHeader`](../src/components/GlobalHeader.tsx).
3. **Keep `main.tsx` thin** — no business logic here; bootstrap only.

## Common tasks

- **Default route after login** — coordinated with [`getRouteForRole`](../src/lib/routing.ts) in [`lib.md`](lib.md) / [`hooks.md`](hooks.md).

## Related docs

- [README.md](README.md) — overview and conventions
- [components.md](components.md) — shell components
- [pages.md](pages.md) — routed screens
- [hooks.md](hooks.md), [store.md](store.md), [lib.md](lib.md)
