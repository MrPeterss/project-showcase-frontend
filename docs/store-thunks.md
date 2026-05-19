# Store thunks (`src/store/thunks/`)

## Purpose

Side-effect orchestration implemented with Redux Toolkit **`createAsyncThunk`**. Thunks **`dispatch` service calls** (`@/services`) and update slices either by:

1. **Manual synchronous actions** from the thunk body (`teamsThunks`, `enrollmentsThunks`, …) — granular loading/error/setters exported from **`slices`**.
2. **`extraReducers` listening to thunk lifecycle** generated alongside the owning slice (**`fetchActiveOffering`** in **`activeOfferingSlice`**).

## Files

Current modules (names mirror domain):

| File |
|------|
| [`coursesThunks.ts`](../src/store/thunks/coursesThunks.ts) |
| [`courseOfferingsThunks.ts`](../src/store/thunks/courseOfferingsThunks.ts) |
| [`semestersThunks.ts`](../src/store/thunks/semestersThunks.ts) |
| [`teamsThunks.ts`](../src/store/thunks/teamsThunks.ts) |
| [`enrollmentsThunks.ts`](../src/store/thunks/enrollmentsThunks.ts) |
| [`projectsCacheThunks.ts`](../src/store/thunks/projectsCacheThunks.ts) |
| [`sparkThunks.ts`](../src/store/thunks/sparkThunks.ts) |

## Patterns illustrated

### A. Dispatch slice setters explicitly

```ts
dispatch(setTeamsLoading({ offeringId, isLoading: true }));
const response = await services.teams.getByCourseOffering(offeringId);
dispatch(setTeams({ offeringId, teams: response.data }));
```

(Full implementation: **`teamsThunks.ts`**.)

### B. Thunk fulfilled handled in `extraReducers`

`fetchActiveOffering` is declared in **`activeOfferingSlice.ts`** and **`addCase(fetchActiveOffering.pending|fulfilled|rejected, …)`** updates `loading/error/offering` — no separate thunk file needed.

Choose **pattern B** when a slice has **exactly one** cohesive async lifecycle; choose **pattern A** when many operations touch the **same keyed map** or you prefer explicit fine-grained flags.

### Chaining

`enrollmentsThunks` may `dispatch(fetchTeamsByOffering(...))` after roster mutations to refresh dependent views — follow this sparingly with clear comments to avoid thunk cycles.

## How to develop here

1. **Prefer `rejectWithValue`** with string messages surfaced in slices.
2. **Always clear loading flags** (`finally` blocks for pattern A).
3. **Throttle duplicate fetches at call sites** (components) if backend is chatty — store layer stays dumb unless you introduce explicit dedupe middleware (not present today).

## Common tasks

- **New REST endpoint workflow** — add method in **`services`**, synchronous reducers (+ types) in **`slices`**, `createAsyncThunk` here, wire component `dispatch`.

## Related docs

- [store.md](store.md), [store-slices.md](store-slices.md), [services.md](services.md)
