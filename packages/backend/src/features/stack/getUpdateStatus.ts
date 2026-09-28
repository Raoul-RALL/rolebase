import { StackUpdateJob } from '@rolebase/shared/model/stack'
import * as yup from 'yup'
import { Member_Role_Enum } from '../../gql'
import { guardOrg } from '../../guards/guardOrg'
import { authedProcedure } from '../../trpc/authedProcedure'
import { getStackUpdateJob } from './utils/stackUpdateJob'

export default authedProcedure
  .input(
    yup.object().shape({
      orgId: yup.string().required(),
    })
  )
  .query(async (opts): Promise<StackUpdateJob | null> => {
    await guardOrg(opts.input.orgId, Member_Role_Enum.Owner, opts.ctx)
    return getStackUpdateJob() ?? null
  })
