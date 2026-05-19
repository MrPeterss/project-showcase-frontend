import { configureStore } from '@reduxjs/toolkit'
import userReducer from './slices/userSlice'
import coursesReducer from './slices/coursesSlice'
import courseOfferingsReducer from './slices/courseOfferingsSlice'
import semestersReducer from './slices/semestersSlice'
import teamsReducer from './slices/teamsSlice'
import deploymentLogsReducer from './slices/deploymentLogsSlice'
import activeOfferingReducer from './slices/activeOfferingSlice'
import courseUiReducer from './slices/courseUiSlice'
import dashboardTabsReducer from './slices/dashboardTabsSlice'
import coursesUiReducer from './slices/coursesUiSlice'
import enrollmentsReducer from './slices/enrollmentsSlice'
import projectsCacheReducer from './slices/projectsCacheSlice'
import sparkReducer from './slices/sparkSlice'

export const store = configureStore({
  reducer: {
    user: userReducer,
    courses: coursesReducer,
    courseOfferings: courseOfferingsReducer,
    semesters: semestersReducer,
    teams: teamsReducer,
    deploymentLogs: deploymentLogsReducer,
    activeOffering: activeOfferingReducer,
    courseUi: courseUiReducer,
    dashboardTabs: dashboardTabsReducer,
    coursesUi: coursesUiReducer,
    enrollments: enrollmentsReducer,
    projectsCache: projectsCacheReducer,
    spark: sparkReducer,
  }
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

// Export dispatch function for use in non-React contexts (like API interceptors)
export const dispatch = store.dispatch
