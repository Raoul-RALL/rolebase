import { CodegenConfig } from '@graphql-codegen/cli'
import {
  fragmentsPath,
  getAddPlugin,
  getConfig,
  schemaOverridesPath,
} from '@rolebase/shared/codegenUtils'

const config: CodegenConfig = {
  overwrite: true,
  watch: true,
  schema: [
    {
      'https://local.hasura.nhost.run/v1/graphql': {
        headers: {
          'x-hasura-admin-secret': 'nhost-admin-secret',
        },
      },
    },
    schemaOverridesPath,
  ],
  documents: ['src/**/*.gql', fragmentsPath],
  generates: {
    'src/graphql.generated.ts': {
      plugins: [
        'typescript',
        'typescript-operations',
        'typescript-react-apollo',
        getAddPlugin(),
      ],
    },
  },
  config: {
    ...getConfig(),
    withRefetchFn: true,
    // Apollo Client 4 exports React hooks and their types from a subpath
    apolloReactCommonImportFrom: '@apollo/client/react',
    apolloReactHooksImportFrom: '@apollo/client/react',
    // Types relying on MutationFunction/BaseMutationOptions, removed in Apollo 4
    withMutationFn: false,
    withMutationOptionsType: false,
  },
}

export default config
