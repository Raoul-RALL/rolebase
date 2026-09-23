import { EmailAddress, sendEmail } from '@rolebase/emails/helpers/sendEmail'
import { emailSchema } from '@rolebase/shared/schemas'
import { TypedDocumentNode } from '@graphql-typed-document-node/core'
import { randomUUID } from 'crypto'
import { parse } from 'graphql'
import * as yup from 'yup'
import { publicProcedure } from '../../trpc'
import { adminRequest } from '../../utils/adminRequest'
import settings from '../../settings'

// Same reasoning as requestPasswordReset.ts: hasura-auth's own mailer gets
// silently filtered by Free.fr for link-bearing emails. Bypass it here too,
// reusing its ticket mechanism so /v1/verify keeps handling the actual
// verification unchanged.

const TICKET_VALIDITY_MS = 30 * 24 * 60 * 60 * 1000 // Matches hasura-auth's own default for email verification

interface UserForVerification {
  id: string
  emailVerified: boolean
  locale: string
  displayName: string
  ticketExpiresAt: string | null
}

const GET_USER_BY_EMAIL = parse(`
  query getUserByEmailForVerification($email: citext!) {
    users(where: { email: { _eq: $email } }) {
      id
      emailVerified
      locale
      displayName
      ticketExpiresAt
    }
  }
`) as unknown as TypedDocumentNode<
  { users: UserForVerification[] },
  { email: string }
>

const SET_USER_TICKET = parse(`
  mutation setUserEmailVerificationTicket(
    $id: uuid!
    $ticket: String!
    $ticketExpiresAt: timestamptz!
  ) {
    updateUser(
      pk_columns: { id: $id }
      _set: { ticket: $ticket, ticketExpiresAt: $ticketExpiresAt }
    ) {
      id
    }
  }
`) as unknown as TypedDocumentNode<
  { updateUser: { id: string } | null },
  { id: string; ticket: string; ticketExpiresAt: string }
>

const content = {
  fr: {
    subject: 'Vérifiez votre adresse email',
    heading: 'Vérification de votre adresse email',
    intro:
      "Confirmez votre adresse email pour finaliser votre inscription sur Rolebase. Si vous n'êtes pas à l'origine de cette demande, ignorez ce message.",
    cta: 'Vérifier mon adresse email',
  },
  en: {
    subject: 'Verify your email address',
    heading: 'Email address verification',
    intro:
      'Confirm your email address to finish setting up your Rolebase account. If you did not make this request, please ignore this message.',
    cta: 'Verify my email address',
  },
}

function getContent(locale: string) {
  return locale === 'fr' ? content.fr : content.en
}

// Public: called right after signup, and to resend the verification email,
// in both cases with an email the caller already knows
export default publicProcedure
  .input(
    yup.object().shape({
      email: emailSchema.required(),
      redirectTo: yup.string().url(),
    })
  )
  .mutation(async (opts): Promise<void> => {
    const { email, redirectTo } = opts.input

    const { users } = await adminRequest(GET_USER_BY_EMAIL, { email })
    const user = users[0]

    if (!user || user.emailVerified) return

    // A ticket was already issued less than a minute ago: skip, to avoid
    // flooding the mailbox on repeated submits
    if (
      user.ticketExpiresAt &&
      new Date(user.ticketExpiresAt).getTime() - Date.now() >
        TICKET_VALIDITY_MS - 60_000
    ) {
      return
    }

    const ticket = `verifyEmail:${randomUUID()}`
    const ticketExpiresAt = new Date(
      Date.now() + TICKET_VALIDITY_MS
    ).toISOString()

    await adminRequest(SET_USER_TICKET, {
      id: user.id,
      ticket,
      ticketExpiresAt,
    })

    const link = `${settings.auth.serverUrl}/verify?ticket=${encodeURIComponent(
      ticket
    )}&type=verifyEmail${
      redirectTo ? `&redirectTo=${encodeURIComponent(redirectTo)}` : ''
    }`

    const { subject, heading, intro, cta } = getContent(user.locale)

    const to: EmailAddress = { Email: email, Name: user.displayName || email }

    await sendEmail({
      From: { Email: 'noreply@rolebase.io', Name: 'Rolebase.io' },
      To: [to],
      Subject: subject,
      HTMLPart: `<!DOCTYPE html><html><head><meta charset="UTF-8"/></head><body style="background-color:#f9f6f3;font-family:Arial,sans-serif;color:#29241f"><table border="0" width="100%" cellpadding="0" cellspacing="0" role="presentation"><tbody><tr><td style="padding:32px 16px"><table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="max-width:465px;background-color:#ffffff;border-radius:12px;margin:0 auto"><tbody><tr><td style="padding:32px 20px"><h1 style="font-size:20px;font-weight:600;margin:0 0 16px">${heading}</h1><p style="font-size:14px;line-height:22px;margin:0 0 16px">${intro}</p><p style="font-size:14px;line-height:22px;margin:0"><a href="${link}" style="color:#2952cc">${cta}</a></p></td></tr></tbody></table></td></tr></tbody></table></body></html>`,
      TextPart: `${intro}\n\n${cta}: ${link}`,
    })
  })
