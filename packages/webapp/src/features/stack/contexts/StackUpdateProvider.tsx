import { useOrgContext } from '@/org/contexts/OrgContext'
import { StackUpdateJob } from '@rolebase/shared/model/stack'
import { TRPCClientError } from '@trpc/client'
import React, { ReactNode, useCallback, useEffect, useState } from 'react'
import { trpc } from 'src/trpc'
import { StackUpdateContext } from './StackUpdateContext'

const POLL_INTERVAL = 3000
const DISMISSED_KEY = 'stack-update-dismissed'

interface Props {
  children: ReactNode
}

// No response from the server (backend restarting or unreachable)
function isNetworkError(error: unknown) {
  return error instanceof TRPCClientError && !error.data
}

// Update job running on the backend, polled while it runs, and retried
// while the backend is unreachable
export default function StackUpdateProvider({ children }: Props) {
  const { orgId } = useOrgContext()
  const [job, setJob] = useState<StackUpdateJob | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [unreachable, setUnreachable] = useState(false)
  // Start date of the finished job the user closed
  const [dismissedAt, setDismissedAt] = useState<string | null>(() => {
    try {
      return localStorage.getItem(DISMISSED_KEY)
    } catch {
      return null
    }
  })

  const fetchJob = useCallback(async () => {
    if (!orgId) return
    try {
      setJob(await trpc.stack.getUpdateStatus.query({ orgId }))
      setUnreachable(false)
    } catch (e) {
      if (isNetworkError(e)) {
        setUnreachable(true)
      } else {
        setError(e instanceof Error ? e.message : String(e))
      }
    }
  }, [orgId])

  useEffect(() => {
    fetchJob()
  }, [fetchJob])

  const isRunning = job?.status === 'running'
  useEffect(() => {
    if (!isRunning && !unreachable) return
    const interval = setInterval(fetchJob, POLL_INTERVAL)
    return () => clearInterval(interval)
  }, [isRunning, unreachable, fetchJob])

  const startUpdate = useCallback(
    async (technologyId: string) => {
      if (!orgId) return
      setError(null)
      try {
        setJob(await trpc.stack.startUpdate.mutate({ orgId, technologyId }))
      } catch (e) {
        if (isNetworkError(e)) {
          setUnreachable(true)
        } else {
          setError(e instanceof Error ? e.message : String(e))
        }
      }
    },
    [orgId]
  )

  const dismissJob = useCallback(() => {
    if (!job) return
    setDismissedAt(job.startedAt)
    try {
      localStorage.setItem(DISMISSED_KEY, job.startedAt)
    } catch {
      // Not persisted: hidden until the page is reloaded
    }
  }, [job])

  const visibleJob =
    job && job.status !== 'running' && job.startedAt === dismissedAt
      ? null
      : job

  return (
    <StackUpdateContext.Provider
      value={{ job: visibleJob, error, unreachable, startUpdate, dismissJob }}
    >
      {children}
    </StackUpdateContext.Provider>
  )
}
