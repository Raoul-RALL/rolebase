import { NhostClientOptions } from '@nhost/nhost-js'

export const isLocal = location.hostname === 'localhost'
export const isStaging = location.hostname === 'staging--rolebase.netlify.app'
export const isSynology = location.hostname.endsWith('synology.me')
export const isShareApp = /^\/share(\/|$)/.test(location.pathname)

export default {
  // Webapp url
  url: isLocal
    ? 'http://localhost:3032'
    : isStaging
    ? 'https://staging--rolebase.netlify.app'
    : isSynology
    ? 'https://rolebase.nafnafnafnaf0.synology.me:3032'
    : 'https://rolebase.mondomaine.fr:3032',

  // Website url
  websiteUrl: 'https://rolebase.io',

  // Local help mirror (docs+guides), served by rolebase-aide.service.
  // Falls back to the live website on environments where it isn't running.
  helpUrl: isLocal
    ? 'http://localhost:3033/aide'
    : isStaging
    ? 'https://rolebase.io'
    : isSynology
    ? 'https://rolebase.nafnafnafnaf0.synology.me:3033/aide'
    : 'https://rolebase.mondomaine.fr:3033/aide',

  // Nhost
  nhost: {
    subdomain: isLocal
      ? 'local'
      : isStaging
      ? 'jjvdhpoooerochuiusam'
      : isSynology
      ? undefined
      : 'scgqkpwwssbncecwwlre',
    region: isLocal || isSynology ? undefined : 'eu-central-1',
    authUrl: isSynology
      ? 'https://rolebase-auth.nafnafnafnaf0.synology.me/v1'
      : undefined,
    graphqlUrl: isSynology
      ? 'https://rolebase-graphql.nafnafnafnaf0.synology.me/v1'
      : undefined,
    storageUrl: isSynology
      ? 'https://rolebase-storage.nafnafnafnaf0.synology.me/v1'
      : undefined,
    // Disable auto signin on share app
    autoSignIn: !isShareApp,
    autoRefreshToken: !isShareApp,
    clientStorageType: isShareApp ? 'cookie' : 'localStorage',
  } as NhostClientOptions,

  functionsUrl: isLocal
    ? 'https://local.functions.local.nhost.run/v1/'
    : isStaging
    ? 'https://jjvdhpoooerochuiusam.functions.eu-central-1.nhost.run/v1/'
    : isSynology
    ? 'https://rolebase-functions.nafnafnafnaf0.synology.me/v1/'
    : 'https://scgqkpwwssbncecwwlre.functions.eu-central-1.nhost.run/v1/',

  backendUrl: isLocal
    ? 'http://localhost:8888'
    : isSynology
    ? 'https://rolebase-backend.nafnafnafnaf0.synology.me'
    : 'https://api.rolebase.io',

  yjsCollab: {
    url: isLocal
      ? 'ws://localhost:1234'
      : isSynology
      ? 'wss://rolebase-collab.nafnafnafnaf0.synology.me'
      : 'wss://collab.rolebase.io',
  },

  // Files
  memberPicture: {
    maxSize: 300, // in px
  },
  orgIcon: {
    maxSize: 256, // in px
  },

  stripe: {
    publicKey:
      isLocal || isStaging
        ? 'pk_test_51MTnUCFbDx5R7pIdjvJ0kQ6gzkXExNcMJxSmAhc6tmF2dTu3qYa4tNQZBFqcy3ZNCobM9cxq4w9nn3gnpHKddHDn00vrm59S4L'
        : 'pk_live_51MTnUCFbDx5R7pIdX4eYwBp6vgGF6oc47ipEL94az2BRzxgXa8p738VMYfmf2824MNiZuuqbsgtwDcaS755gcUzU00ZeBi5QjW',
  },

  crisp: {
    websiteId: '652544cd-14f6-4c8c-9a04-2a56676dd4a0',
  },

  sentry: {
    dsn: 'https://68e026695164824b4e6e2067784ceb7a@sentry.lonestone.io/5',
  },

  apps: {
    office365: {
      clientId: 'b92369ce-3fc5-4873-987a-335f0917672b',
    },
    googlecalendar: {
      clientId:
        '749917420406-vpf503tb2pnvvcm6v16jh6oe1js7n155.apps.googleusercontent.com',
    },
  },
}
