// Technologies listed on the "Tech stack" settings page.
// Used by the webapp (display), its vite config (installed versions at build
// time) and the backend (update button).

export type StackSource =
  // npm package, installed version read from node_modules
  | 'npm'
  // Node.js runtime used for the build
  | 'node'
  // Hasura version set in nhost/nhost.toml
  | 'hasura'

export interface StackTechnology {
  // Key of translations StackPage.categories.* and StackPage.descriptions.*
  id: string
  name: string
  category: string
  source: StackSource
  // Package whose installed version is displayed
  npmPackage?: string
  // Packages bumped together to their latest stable version by the update
  // button, in every workspace declaring them. A trailing "*" matches a scope.
  // No update button without it (infrastructure: Node.js, Hasura).
  updatePackages?: string[]
}

export const stackTechnologies: StackTechnology[] = [
  {
    id: 'react',
    name: 'React',
    category: 'framework',
    source: 'npm',
    npmPackage: 'react',
    updatePackages: ['react', 'react-dom', '@types/react', '@types/react-dom'],
  },
  {
    id: 'typescript',
    name: 'TypeScript',
    category: 'language',
    source: 'npm',
    npmPackage: 'typescript',
    updatePackages: ['typescript'],
  },
  { id: 'node', name: 'Node.js', category: 'runtime', source: 'node' },
  {
    id: 'vite',
    name: 'Vite',
    category: 'build',
    source: 'npm',
    npmPackage: 'vite',
    // Plugins, Vitest and Storybook declare Vite as a peer dependency
    updatePackages: [
      'vite',
      '@vitejs/plugin-react',
      'vite-plugin-svgr',
      'vite-tsconfig-paths',
      'vitest',
      'storybook',
      '@storybook/*',
      'eslint-plugin-storybook',
    ],
  },
  {
    id: 'chakra',
    name: 'Chakra UI',
    category: 'styling',
    source: 'npm',
    npmPackage: '@chakra-ui/react',
    updatePackages: ['@chakra-ui/react'],
  },
  { id: 'hasura', name: 'Hasura', category: 'api', source: 'hasura' },
  {
    id: 'nhost',
    name: 'Nhost JS',
    category: 'backend',
    source: 'npm',
    npmPackage: '@nhost/nhost-js',
    updatePackages: ['@nhost/nhost-js'],
  },
  {
    id: 'apollo',
    name: 'Apollo Client',
    category: 'data',
    source: 'npm',
    npmPackage: '@apollo/client',
    updatePackages: ['@apollo/client', 'rxjs'],
  },
  {
    id: 'graphql',
    name: 'GraphQL',
    category: 'data',
    source: 'npm',
    npmPackage: 'graphql',
    updatePackages: ['graphql'],
  },
  {
    id: 'trpc',
    name: 'tRPC',
    category: 'api',
    source: 'npm',
    npmPackage: '@trpc/client',
    updatePackages: ['@trpc/client', '@trpc/server'],
  },
  {
    id: 'reactRouter',
    name: 'React Router',
    category: 'routing',
    source: 'npm',
    npmPackage: 'react-router',
    updatePackages: ['react-router'],
  },
  {
    id: 'reactHookForm',
    name: 'React Hook Form',
    category: 'forms',
    source: 'npm',
    npmPackage: 'react-hook-form',
    updatePackages: ['react-hook-form'],
  },
  {
    id: 'i18next',
    name: 'i18next',
    category: 'i18n',
    source: 'npm',
    npmPackage: 'i18next',
    updatePackages: ['i18next', 'react-i18next'],
  },
  {
    id: 'tiptap',
    name: 'Tiptap',
    category: 'editor',
    source: 'npm',
    npmPackage: '@tiptap/core',
    updatePackages: ['@tiptap/*'],
  },
  {
    id: 'yjs',
    name: 'Yjs',
    category: 'collab',
    source: 'npm',
    npmPackage: 'yjs',
    updatePackages: ['yjs'],
  },
  {
    id: 'd3',
    name: 'D3',
    category: 'dataviz',
    source: 'npm',
    npmPackage: 'd3',
    updatePackages: ['d3', '@types/d3'],
  },
  {
    id: 'recharts',
    name: 'Recharts',
    category: 'dataviz',
    source: 'npm',
    npmPackage: 'recharts',
    updatePackages: ['recharts'],
  },
  {
    id: 'dateFns',
    name: 'date-fns',
    category: 'dates',
    source: 'npm',
    npmPackage: 'date-fns',
    updatePackages: ['date-fns', 'date-fns-tz'],
  },
  {
    id: 'sentry',
    name: 'Sentry',
    category: 'monitoring',
    source: 'npm',
    npmPackage: '@sentry/react',
    updatePackages: ['@sentry/react', '@sentry/node', '@sentry/profiling-node'],
  },
]

export type StackUpdateStatus = 'running' | 'success' | 'failed'

export interface StackUpdateJob {
  technologyId: string
  status: StackUpdateStatus
  startedAt: string
  endedAt?: string
  // Package versions installed, e.g. "react@19.3.0"
  targets: string[]
  // Step running ("Install", "Types webapp"...), and the one that failed
  step?: string
  failedStep?: string
  // Backend dependencies changed: restart needed to run them
  needsBackendRestart?: boolean
  log: string
}
