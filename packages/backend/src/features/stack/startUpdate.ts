import { StackUpdateJob } from '@rolebase/shared/model/stack'
import * as yup from 'yup'
import { Member_Role_Enum } from '../../gql'
import { guardOrg } from '../../guards/guardOrg'
import { authedProcedure } from '../../trpc/authedProcedure'
import { startStackUpdateJob } from './utils/stackUpdateJob'

// Runs commands on the server: restricted to org owners
export default authedProcedure
  .input(
    yup.object().shape({
      orgId: yup.string().required(),
      technologyId: yup.string().required(),
    })
  )
  .mutation(async (opts): Promise<StackUpdateJob> => {
    const { orgId, technologyId } = opts.input
    await guardOrg(orgId, Member_Role_Enum.Owner, opts.ctx)
    return startStackUpdateJob(technologyId)
  })
