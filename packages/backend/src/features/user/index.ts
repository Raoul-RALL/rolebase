import { router } from '../../trpc'
import checkEmailDomain from './checkEmailDomain'
import requestPasswordReset from './requestPasswordReset'

export default router({
  checkEmailDomain,
  requestPasswordReset,
})
