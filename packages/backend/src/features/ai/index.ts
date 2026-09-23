import { publicProcedure, router } from '../../trpc'
import settings from '../../settings'
import generateMeetingSummary from './generateMeetingSummary'
import generateRole from './generateRole'

export default router({
  generateMeetingSummary,
  generateRole,

  // Lets the webapp hide AI features when no OpenAI key is configured
  // (e.g. self-hosted instances), instead of failing on every click
  isEnabled: publicProcedure.query((): boolean => !!settings.openai.apiKey),
})
