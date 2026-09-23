import * as Sentry from '@sentry/node'

// Disabled: self-hosted instance, no telemetry sent to Lonestone's Sentry.
// Sentry.* calls below are safe no-ops since Sentry.init() is never called.

export function startErrorHandling(name: string) {
  return Sentry.startInactiveSpan({ name, op: 'http.server' })
}

export function captureError(error: Error, extra?: Record<string, unknown>) {
  Sentry.captureException(error, extra ? { extra } : undefined)
}
