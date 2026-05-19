# Pages (`src/pages/` root)

## Purpose

**Route-connected screens** and small page-only modules. **`App.tsx`** is the sole route table: each file here (or **`index.tsx` in a subfolder**) is typically imported as an `element=` for some path.

**Grouped features** (`Courses/`, `CourseSettings/`, `Dashboard/`) have dedicated docs:

- [pages-courses.md](pages-courses.md)
- [pages-course-settings.md](pages-course-settings.md)
- [pages-dashboard.md](pages-dashboard.md)

## Key files (root-level pages)

| File | Typical route / role | Role |
|------|----------------------|------|
| [`Courses/index.tsx`](../src/pages/Courses/index.tsx) | `/courses` | Catalog: semesters, offerings, admin modals |
| [`CourseProjects.tsx`](../src/pages/CourseProjects.tsx) | `/courses/:offeringId` | Team roster, team CRUD, entry to dashboards |
| [`CourseDashboard.tsx`](../src/pages/CourseDashboard.tsx) | `.../dashboard` | Course-level dashboard placeholder |
| [`CourseTeamDashboard.tsx`](../src/pages/CourseTeamDashboard.tsx) | `.../dashboard/:teamId` | Course-scoped deploy UI (reuses Dashboard sections) |
| [`CourseSettings.tsx`](../src/pages/CourseSettings.tsx) | `.../settings` | Offering admin |
| [`CourseSpark.tsx`](../src/pages/CourseSpark.tsx) | `.../spark` | Spark keys + analytics |
| [`Dashboard/index.tsx`](../src/pages/Dashboard/index.tsx) | `/dashboard/:teamId` | Standalone team dashboard (legacy path) |
| [`Admin.tsx`](../src/pages/Admin.tsx) | `/admin` | Global admin tooling |
| [`NotFound.tsx`](../src/pages/NotFound.tsx) | catch-all `*` | Generic 404 |
| [`ProjectNotFound.tsx`](../src/pages/ProjectNotFound.tsx) | `/not-found/:team_name` | Deploy-time missing project |
| [`Projects.tsx`](../src/pages/Projects.tsx) | **unrouted** | Stub (“under construction”) — **`NavBar` still links to `/projects`** with no matching route |

## Architecture

- **Course subtree** shares **`CourseLayout`** + **`useCourseShell()`** for `offeringId`, loading/error, effective role alignment.
- **Data** — Redux thunks + selectors preferred over ad-hoc `fetch`; see [store-thunks.md](store-thunks.md).
- **UI** — compose from `@/components/ui/*`, domain modals from `@/components/modals`.

## How to develop here

1. **Register** `<Route>` in [`App.tsx`](../src/App.tsx). Course-specific pages usually nest **under** `CourseLayout`.
2. **Multi-file screens** — use a folder with `index.tsx` (`Courses/`, `Dashboard/`).
3. **Colocated pure helpers** — e.g. `CourseSettings/enrollmentUtils.ts` (documented separately).
4. **Auth & roles** — `useAuth()`, `lib/courseRoleAccess`, guards in layout or inline `<Navigate>`.

## Common tasks

- **New standalone page** — add `Foo.tsx`, wire route, optionally adjust `shouldShowNav` / header in `App.tsx`.
- **New course tab** — add nested route under `/courses/:offeringId`, update `CourseNavBar` + any `CourseLayout` allowlist.

## Related docs

- [app.md](app.md), [components.md](components.md), [hooks.md](hooks.md)
- [pages-courses.md](pages-courses.md), [pages-course-settings.md](pages-course-settings.md), [pages-dashboard.md](pages-dashboard.md)
- [store.md](store.md), [services.md](services.md)
