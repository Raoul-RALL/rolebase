import { StackTechnology } from '../model/stack'
import { compareVersions, isStableVersion } from './compareVersions'

// Latest stable versions, fetched from public registries

async function fetchJson(url: string, headers?: HeadersInit) {
  const response = await fetch(url, { cache: 'no-store', headers })
  if (!response.ok) throw new Error(`${response.status} ${url}`)
  return response.json()
}

export async function fetchLatestNpmVersion(
  packageName: string
): Promise<string> {
  const encodedName = encodeURIComponent(packageName)

  // Fast path: `latest` tag, when it points to a final release
  const latest = await fetchJson(
    `https://registry.npmjs.org/${encodedName}/latest`
  )
  if (typeof latest?.version === 'string' && isStableVersion(latest.version)) {
    return latest.version
  }

  // Otherwise, highest final release published
  const packument = await fetchJson(
    `https://registry.npmjs.org/${encodedName}`,
    { Accept: 'application/vnd.npm.install-v1+json' }
  )
  const highest = Object.keys(packument?.versions ?? {})
    .filter(isStableVersion)
    .reduce<string | null>(
      (best, version) =>
        best && compareVersions(best, version) >= 0 ? best : version,
      null
    )
  return highest ?? 'unknown'
}

async function fetchLatestNodeLtsVersion(): Promise<string> {
  const releases: { version: string; lts: boolean | string }[] =
    await fetchJson('https://nodejs.org/dist/index.json')
  const latestLts = releases.find((release) => release.lts)
  return latestLts ? latestLts.version.replace(/^v/, '') : 'unknown'
}

async function fetchLatestHasuraVersion(): Promise<string> {
  const release = await fetchJson(
    'https://api.github.com/repos/hasura/graphql-engine/releases/latest'
  )
  return typeof release?.tag_name === 'string' ? release.tag_name : 'unknown'
}

export async function fetchLatestVersion(
  tech: StackTechnology
): Promise<string> {
  try {
    switch (tech.source) {
      case 'npm':
        return await fetchLatestNpmVersion(tech.npmPackage!)
      case 'node':
        return await fetchLatestNodeLtsVersion()
      case 'hasura':
        return await fetchLatestHasuraVersion()
    }
  } catch (error) {
    console.error(error)
  }
  return 'unknown'
}
