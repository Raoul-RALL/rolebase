import { StackUpdateJob } from '@rolebase/shared/model/stack'
import { createContext, useContext } from 'react'

export interface StackUpdateContextValue {
  // Last update job run by the backend since it started
  job: StackUpdateJob | null
  error: string | null
  // Backend not responding, retried automatically
  unreachable: boolean
  startUpdate(technologyId: string): Promise<void>
  // Hides the finished job
  dismissJob(): void
}

const defaultValue: StackUpdateContextValue = {
  job: null,
  error: null,
  unreachable: false,
  startUpdate: async () => undefined,
  dismissJob: () => undefined,
}

export const StackUpdateContext =
  createContext<StackUpdateContextValue>(defaultValue)

export function useStackUpdateContext(): StackUpdateContextValue {
  return useContext(StackUpdateContext)
}
