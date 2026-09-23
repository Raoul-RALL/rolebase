import { useEffect, useState } from 'react'
import { trpc } from 'src/trpc'

// Cached across the app lifetime: this never changes without a backend restart
let cached: boolean | undefined

// Whether AI features (meeting summary, role generation) are usable, ie.
// whether an OpenAI key is configured on the backend. Self-hosted instances
// typically have none, so these buttons should stay hidden instead of
// failing on click.
export default function useAiEnabled(): boolean {
  const [enabled, setEnabled] = useState(cached ?? false)

  useEffect(() => {
    if (cached !== undefined) return
    trpc.ai.isEnabled
      .query()
      .then((result) => {
        cached = result
        setEnabled(result)
      })
      .catch(() => {
        // Backend unreachable: keep the buttons hidden rather than risk a
        // failing click
      })
  }, [])

  return enabled
}
