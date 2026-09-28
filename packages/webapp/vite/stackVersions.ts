import fs from 'fs'
import path from 'path'
import type { PluginOption } from 'vite'
import { stackTechnologies } from '../src/features/stack/stackTechnologies'

const VIRTUAL_ID = 'virtual:stack-versions'
const RESOLVED_ID = '\0' + VIRTUAL_ID
const NHOST_TOML = path.resolve(__dirname, '../../../nhost/nhost.toml')

// Walks up node_modules folders like Node resolution, without going through
// the package's exports map (which often hides package.json)
function readNpmVersion(packageName: string): string {
  let dir = path.resolve(__dirname, '..')
  while (true) {
    const file = path.join(dir, 'node_modules', packageName, 'package.json')
    if (fs.existsSync(file)) {
      return JSON.parse(fs.readFileSync(file, 'utf8')).version ?? 'unknown'
    }
    const parent = path.dirname(dir)
    if (parent === dir) return 'unknown'
    dir = parent
  }
}

function readHasuraVersion(): string {
  try {
    const toml = fs.readFileSync(NHOST_TOML, 'utf8')
    const match = toml.match(/\[hasura\][^[]*?version\s*=\s*'([^']+)'/)
    return match?.[1] ?? 'unknown'
  } catch {
    return 'unknown'
  }
}

function readVersion(id: string): string {
  const technology = stackTechnologies.find((tech) => tech.id === id)
  switch (technology?.source) {
    case 'npm':
      return readNpmVersion(technology.npmPackage!)
    case 'node':
      return process.version.replace(/^v/, '')
    case 'hasura':
      return readHasuraVersion()
    default:
      return 'unknown'
  }
}

// Exposes installed versions of the tech stack, captured at build time,
// as `import stackVersions from 'virtual:stack-versions'`
export default function stackVersions(): PluginOption {
  return {
    name: 'stack-versions',
    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_ID
    },
    load(id) {
      if (id !== RESOLVED_ID) return
      const versions = Object.fromEntries(
        stackTechnologies.map((tech) => [tech.id, readVersion(tech.id)])
      )
      return `export default ${JSON.stringify(versions)}`
    },
  }
}
