import { fetchLatestVersion } from '@rolebase/shared/helpers/fetchLatestVersion'
import { StackTechnology } from '@rolebase/shared/model/stack'
import { useEffect, useState } from 'react'

// Latest stable version of each technology, fetched from public registries.
// A missing key means the version is still loading.
export default function useLatestVersions(technologies: StackTechnology[]) {
  const [latestVersions, setLatestVersions] = useState<Record<string, string>>(
    {}
  )

  useEffect(() => {
    let cancelled = false
    technologies.forEach(async (tech) => {
      const version = await fetchLatestVersion(tech)
      if (cancelled) return
      setLatestVersions((versions) => ({ ...versions, [tech.id]: version }))
    })
    return () => {
      cancelled = true
    }
  }, [technologies])

  return latestVersions
}
