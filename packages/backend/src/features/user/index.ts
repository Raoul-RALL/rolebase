import { router } from '../../trpc'
import checkEmailDomain from './checkEmailDomain'
import requestEmailVerification from './requestEmailVerification'
import requestPasswordReset from './requestPasswordReset'

export default router({
  checkEmailDomain,
  requestEmailVerification,
  requestPasswordReset,
})
