import { useOrgContext } from '@/org/contexts/OrgContext'
import { StackUpdateJob } from '@rolebase/shared/model/stack'
import React, { ReactNode, useCallback, useEffect, useState } from 'react'
import { trpc } from 'src/trpc'
import { StackUpdateContext } from './StackUpdateContext'

const POLL_INTERVAL = 3000

interface Props {
  children: ReactNode
}

// Update job running on the backend, polled while it runs
export default function StackUpdateProvider({ children }: Props) {
  const { orgId } = useOrgContext()
  const [job, setJob] = useState<StackUpdateJob | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchJob = useCallback(async () => {
    if (!orgId) return
    try {
      setJob(await trpc.stack.getUpdateStatus.query({ orgId }))
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }, [orgId])

  useEffect(() => {
    fetchJob()
  }, [fetchJob])

  const isRunning = job?.status === 'running'
  useEffect(() => {
    if (!isRunning) return
    const interval = setInterval(fetchJob, POLL_INTERVAL)
    return () => clearInterval(interval)
  }, [isRunning, fetchJob])

  const startUpdate = useCallback(
    async (technologyId: string) => {
      if (!orgId) return
      setError(null)
      try {
        setJob(await trpc.stack.startUpdate.mutate({ orgId, technologyId }))
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e))
      }
    },
    [orgId]
  )

  return (
    <StackUpdateContext.Provider value={{ job, error, startUpdate }}>
      {children}
    </StackUpdateContext.Provider>
  )
}
