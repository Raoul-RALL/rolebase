import { StackUpdateJob } from '@rolebase/shared/model/stack'
import { createContext, useContext } from 'react'

export interface StackUpdateContextValue {
  // Last update job run by the backend since it started
  job: StackUpdateJob | null
  error: string | null
  startUpdate(technologyId: string): Promise<void>
}

const defaultValue: StackUpdateContextValue = {
  job: null,
  error: null,
  startUpdate: async () => undefined,
}

export const StackUpdateContext =
  createContext<StackUpdateContextValue>(defaultValue)

export function useStackUpdateContext(): StackUpdateContextValue {
  return useContext(StackUpdateContext)
}
