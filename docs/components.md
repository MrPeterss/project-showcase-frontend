# Components (`src/components/`)

## Purpose

Folder-level **`src/components`** holds **feature-level UI**: course layout and navigation, authentication chrome (login card, legacy nav bar, profile), route helpers, presentation wrappers, and **`ProjectStatusBadge`**. Presentation primitives live in **`ui/`**; domain CRUD dialogs live in **`modals/`** (each has its own doc).

There is **no** root barrel `components/index.ts`; import from explicit paths (`@/components/CourseLayout`).

## Key files

| File | Purpose |
|------|---------|
| [`CourseLayout.tsx`](../src/components/CourseLayout.tsx) | Route layout for `/courses/:offeringId/*`: resolves active offering, role gates (`settings`, `spark`), “view as student”, `<Outlet />` |
| [`CourseNavBar.tsx`](../src/components/CourseNavBar.tsx) | Tabs/links for Projects, Settings, Spark, team dashboards (uses role access + Redux) |
| [`GlobalHeader.tsx`](../src/components/GlobalHeader.tsx) | Sticky app header; hidden on `/login`; back affordance + `ProfileButton` |
| [`NavBar.tsx`](../src/components/NavBar.tsx) | Legacy top nav where `App.tsx` enables it (`shouldShowNav`) |
| [`ProfileButton.tsx`](../src/components/ProfileButton.tsx) | Avatar menu (logout, admin link); used by header/nav |
| [`LoginCard.tsx`](../src/components/LoginCard.tsx) | Google sign-in; respects `?redirect=` |
| [`ProtectedRoute.tsx`](../src/components/ProtectedRoute.tsx) | Auth redirect helpers; **`RootRedirect`** exported for optional use — **not wired in `App.tsx` today** |
| [`ErrorBoundary.tsx`](../src/components/ErrorBoundary.tsx) | `AppErrorBoundary` class component wrapping the router |
| [`CollapsibleCard.tsx`](../src/components/CollapsibleCard.tsx) | Reusable expandable card |
| [`ProjectStatusBadge.tsx`](../src/components/ProjectStatusBadge.tsx) | Thin wrapper importing shared dashboard badge helpers |

**Subfolders:** [components-ui.md](components-ui.md), [components-modals.md](components-modals.md).

## Architecture

- **Redux:** `CourseLayout`, `CourseNavBar`, and most **modals** dispatch thunks / read selectors (`activeOffering`, `courseUi`, `dashboardTabs`, `teams`, etc.). See [`store.md`](store.md).
- **Hooks:** `useAuth`, `useRoleAccess`, `useCourseShell` glue layout and nav to Firebase and offering context. See [`hooks.md`](hooks.md).
- **Lib:** routing helpers (`getRouteForRole`), `courseRoleAccess`, `semesterUtils`. See [`lib.md`](lib.md).
- **Avoid:** **`ui/`** should stay presentation-only without Redux/pages imports (keep domain in parent or modals).

**Note:** `ProjectStatusBadge` imports from **`pages/Dashboard/shared`** — an upward dependency worth avoiding in new components (prefer moving shared badges to `lib/` or `components/` if refactoring).

## How to develop here

1. **New reusable atom/molecule UI** → add under [`components/ui/`](components-ui.md) (`kebab-case` filenames where established).
2. **New CRUD/dialog** → add under [`components/modals/`](components-modals.md) and export from `modals/index.ts`.
3. **New shell/nav/guard** → PascalCase file in this folder root.
4. **Imports** — `@/components/...`, `@/hooks/...`, `@/store/hooks`.
5. **Performance** — `CourseNavBar` uses `React.memo`; follow that pattern only when profiling proves it matters.

## Common tasks

- **New course-tabbed area** — update `CourseNavBar` (+ role checks in `lib/courseRoleAccess`), add nested `<Route>` in `App.tsx` under `CourseLayout`, optionally enforce in `CourseLayout` like **settings/spark**.

## Related docs

- [app.md](app.md), [pages.md](pages.md)
- [components-ui.md](components-ui.md), [components-modals.md](components-modals.md)
- [hooks.md](hooks.md), [store.md](store.md), [lib.md](lib.md)
