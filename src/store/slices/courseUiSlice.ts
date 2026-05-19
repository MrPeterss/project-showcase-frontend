import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface CourseUiState {
  /** Site admin "view as student" toggle, keyed by course offering id */
  viewAsStudentByOfferingId: Record<number, boolean>;
}

const initialState: CourseUiState = {
  viewAsStudentByOfferingId: {},
};

const courseUiSlice = createSlice({
  name: 'courseUi',
  initialState,
  reducers: {
    setViewAsStudentForOffering(
      state,
      action: PayloadAction<{ offeringId: number; value: boolean }>,
    ) {
      const { offeringId, value } = action.payload;
      if (value) {
        state.viewAsStudentByOfferingId[offeringId] = true;
      } else {
        delete state.viewAsStudentByOfferingId[offeringId];
      }
    },
    toggleViewAsStudentForOffering(
      state,
      action: PayloadAction<number>,
    ) {
      const id = action.payload;
      const cur = state.viewAsStudentByOfferingId[id] ?? false;
      if (cur) {
        delete state.viewAsStudentByOfferingId[id];
      } else {
        state.viewAsStudentByOfferingId[id] = true;
      }
    },
    clearCourseUiForOffering(state, action: PayloadAction<number>) {
      delete state.viewAsStudentByOfferingId[action.payload];
    },
  },
});

export const {
  setViewAsStudentForOffering,
  toggleViewAsStudentForOffering,
  clearCourseUiForOffering,
} = courseUiSlice.actions;

export default courseUiSlice.reducer;
