# Store slices (`src/store/slices/`)

## Purpose

**Reducers and synchronous actions** for global client state Redux owns: entity caches, keyed maps by **`offeringId`** / **`teamId`**, session **user**, and **UI slices** that must cross components (catalog semester selection, dashboard tab sets capped at three, admin “view as student”). Deployment log lines accumulate in **`deploymentLogsSlice`** for streaming dashboards.

React Query **is not used**; server list lifecycle (loading/error) lives alongside normalized data fields.

## Slice inventory (conceptual grouping)

### Session & catalog

| Slice | Responsibility |
|-------|----------------|
| **`userSlice`** | Authenticated **`User`** profile used app-wide ([`tests/store/slices/userSlice.test.ts`](../tests/store/slices/userSlice.test.ts)) |
| **`coursesSlice`**, **`courseOfferingsSlice`**, **`semestersSlice`** | Course catalog aggregates |
| **`coursesUiSlice`** | UI-only catalog state (selected semester filter) |

### Teams, enrollments, projects, Spark

| Slice | Responsibility |
|-------|------------------|
| **`teamsSlice`** | Teams by offering + “my teams” + optional team detail lookups |
| **`enrollmentsSlice`** | Roster payloads keyed per offering |
| **`projectsCacheSlice`** | Cached project payloads for dashboards/settings flows |
| **`sparkSlice`** | Spark keys/analytics payloads per scope |

### Course shell & dashboards

| Slice | Responsibility |
|-------|------------------|
| **`activeOfferingSlice`** | Current **`CourseOffering`** for `/courses/:offeringId` (+ **`fetchActiveOffering`** **defined in-file** via `extraReducers`) |
| **`courseUiSlice`** | **`viewAsStudentByOfferingId`** keyed map |
| **`dashboardTabsSlice`** | Open tab ids per **`offeringId`** (enforce max three in reducers or callers) |

### Streaming

| Slice | Responsibility |
|-------|------------------|
| **`deploymentLogsSlice`** | Append/clear log lines during deploy streams |

## What belongs here vs elsewhere

| Keep in slice | Prefer local component state |
|---------------|------------------------------|
| Shared server cache with loading/error | Modal open/close, transient field focus |
| Cross-route UI (tabs, view-as-student) | One-off form drafts until submit |
| User session | Profile dropdown open |
| Bookmarks / deep links | — (use **URL** params instead) |

**Effective role** is **not** stored alone — see **`makeSelectEffectiveRole`** in [store-selectors.md](store-selectors.md).

## How to develop here

1. **New cache** — define `initialState` with explicit `loading`/`error` fields per key if data is keyed by id.
2. **Async work** — put **`createAsyncThunk`** either **next to the slice** (`activeOfferingSlice` style) or in **`thunks/`** (teams/enrollments style); see [store-thunks.md](store-thunks.md).
3. **Clear on navigation** — dispatch **`clear*`** reducers when leaving sensitive subtrees if stale data would mislead.

## Common tasks

- **Add UI flag keyed by offering** — follow **`courseUiSlice`** / **`dashboardTabsSlice`** naming patterns (`byOfferingId` records).

## Related docs

- [store.md](store.md), [store-thunks.md](store-thunks.md), [store-selectors.md](store-selectors.md)
