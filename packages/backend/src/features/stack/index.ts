import { router } from '../../trpc'
import getUpdateStatus from './getUpdateStatus'
import startUpdate from './startUpdate'

export default router({
  getUpdateStatus,
  startUpdate,
})
