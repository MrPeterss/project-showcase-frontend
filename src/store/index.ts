import { configureStore } from '@reduxjs/toolkit'
import userReducer from './slices/userSlice'
import coursesReducer from './slices/coursesSlice'
import courseOfferingsReducer from './slices/courseOfferingsSlice'
import semestersReducer from './slices/semestersSlice'

export const store = configureStore({
  reducer: {
    user: userReducer,
    courses: coursesReducer,
    courseOfferings: courseOfferingsReducer,
    semesters: semestersReducer,
  }
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

// Export dispatch function for use in non-React contexts (like API interceptors)
export const dispatch = store.dispatch
