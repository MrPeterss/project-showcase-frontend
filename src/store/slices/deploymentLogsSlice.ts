import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { ParsedLogLine } from '@/services/projects'
import type { Project } from '@/services/types'

export interface DeploymentLogsState {
  buildLogs: ParsedLogLine[]
  isDeploying: boolean
  streamStarted: boolean
  error: string | null
  deployedProject: Project | null
}

const initialState: DeploymentLogsState = {
  buildLogs: [],
  isDeploying: false,
  streamStarted: false,
  error: null,
  deployedProject: null,
}

const deploymentLogsSlice = createSlice({
  name: 'deploymentLogs',
  initialState,
  reducers: {
    addBuildLog: (state, action: PayloadAction<ParsedLogLine>) => {
      state.buildLogs.push(action.payload)
    },
    addBuildLogs: (state, action: PayloadAction<ParsedLogLine[]>) => {
      state.buildLogs.push(...action.payload)
    },
    clearBuildLogs: (state) => {
      state.buildLogs = []
    },
    setDeploying: (state, action: PayloadAction<boolean>) => {
      state.isDeploying = action.payload
      if (action.payload) {
        // Clear logs when starting new deployment
        state.buildLogs = []
        state.streamStarted = false
        state.error = null
        state.deployedProject = null
      }
    },
    setStreamStarted: (state, action: PayloadAction<boolean>) => {
      state.streamStarted = action.payload
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
      state.isDeploying = false
    },
    setDeployedProject: (state, action: PayloadAction<Project | null>) => {
      state.deployedProject = action.payload
      state.isDeploying = false
    },
    reset: (state) => {
      state.buildLogs = []
      state.isDeploying = false
      state.streamStarted = false
      state.error = null
      state.deployedProject = null
    },
  },
})

export const {
  addBuildLog,
  addBuildLogs,
  clearBuildLogs,
  setDeploying,
  setStreamStarted,
  setError,
  setDeployedProject,
  reset,
} = deploymentLogsSlice.actions

export default deploymentLogsSlice.reducer

