import type { RootState } from '../index'

export const selectUser = (state: RootState) => state.user.user
export const selectIsLoading = (state: RootState) => state.user.isLoading
export const selectError = (state: RootState) => state.user.error
