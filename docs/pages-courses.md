# Courses page module (`src/pages/Courses/`)

## Purpose

The **`/courses`** catalog: choose or filter by **semester**, browse **course offerings** in grid/list/hierarchical layouts, and open **admin modals** to manage semesters, courses, and offerings. Server lists come from Redux (**`semesters`**, **`courses`**, **`courseOfferings`**, **`coursesUi`** for selected semester).

## Key files

| File | Role |
|------|------|
| [`index.tsx`](../src/pages/Courses/index.tsx) | Page shell: auth guard, data fetch on mount, composes child sections |
| [`CoursesHeader.tsx`](../src/pages/Courses/CoursesHeader.tsx) | Title / actions row |
| [`SemesterSelector.tsx`](../src/pages/Courses/SemesterSelector.tsx) | Semester filter UI (backed by `coursesUi` / related slice) |
| [`CourseOfferingsList.tsx`](../src/pages/Courses/CourseOfferingsList.tsx) | List presentation |
| [`CourseOfferingsGrid.tsx`](../src/pages/Courses/CourseOfferingsGrid.tsx) | Grid presentation |
| [`CourseOfferingsBySemester.tsx`](../src/pages/Courses/CourseOfferingsBySemester.tsx) | Group-by-semester view |
| [`CourseCell.tsx`](../src/pages/Courses/CourseCell.tsx) | Single offering tile / row behaviors |
| [`CoursesModals.tsx`](../src/pages/Courses/CoursesModals.tsx) | Opens correct modal based on catalog admin actions |

## Architecture

Dispatches **`fetchSemesters`** / **`fetchCourseOfferings`** style thunks registered in **`store/thunks/`**; selectors from **`coursesSelectors`** / **`courseOfferingsSelectors`** / **`semestersSelectors`**. Modal bodies live in **`@/components/modals`**.

## How to develop here

1. **Keep fetch orchestration at page level** — child components receive props or selectors, not duplicated thunks unless isolated for clarity.
2. **New listing mode** — add a presentational sibling next to **`CourseOfferingsList`/`Grid`**; prefer pure props.
3. **Admin-only affordances** — gate with `useAuth()` / **`userSelectors`** alongside role checks consistent with **`lib/courseRoleAccess`** patterns.

## Common tasks

- **New semester filter persistence** — likely touch **`coursesUiSlice`** ([store-slices.md](store-slices.md)).

## Related docs

- [pages.md](pages.md), [components-modals.md](components-modals.md)
- [store-slices.md](store-slices.md), [store-thunks.md](store-thunks.md)
