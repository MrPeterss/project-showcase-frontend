import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

/** UI-only filters for the /courses hub (not entity data) */
interface CoursesUiState {
  selectedSemesterId: string;
}

const initialState: CoursesUiState = {
  selectedSemesterId: '',
};

const coursesUiSlice = createSlice({
  name: 'coursesUi',
  initialState,
  reducers: {
    setSelectedSemesterId(state, action: PayloadAction<string>) {
      state.selectedSemesterId = action.payload;
    },
    clearCoursesUi(state) {
      state.selectedSemesterId = '';
    },
  },
});

export const { setSelectedSemesterId, clearCoursesUi } = coursesUiSlice.actions;
export default coursesUiSlice.reducer;
