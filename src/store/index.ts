import { configureStore } from '@reduxjs/toolkit'
import userReducer from './slices/userSlice'
import coursesReducer from './slices/coursesSlice'
import semestersReducer from './slices/semestersSlice'

export const store = configureStore({
  reducer: {
    user: userReducer,
    courses: coursesReducer,
    semesters: semestersReducer,
  }
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
