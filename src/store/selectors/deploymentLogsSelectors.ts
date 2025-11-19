import type { RootState } from '../index'

export const selectBuildLogs = (state: RootState) => state.deploymentLogs.buildLogs
export const selectIsDeploying = (state: RootState) => state.deploymentLogs.isDeploying
export const selectDeploymentError = (state: RootState) => state.deploymentLogs.error
export const selectDeployedProject = (state: RootState) => state.deploymentLogs.deployedProject



