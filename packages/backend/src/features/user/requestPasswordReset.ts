import { EmailAddress, sendEmail } from '@rolebase/emails/helpers/sendEmail'
import { emailSchema } from '@rolebase/shared/schemas'
import { TypedDocumentNode } from '@graphql-typed-document-node/core'
import { randomUUID } from 'crypto'
import { parse } from 'graphql'
import * as yup from 'yup'
import { publicProcedure } from '../../trpc'
import { adminRequest } from '../../utils/adminRequest'
import settings from '../../settings'

// hasura-auth's own SMTP client sends emails that Free.fr's outbound
// anti-phishing filter silently drops when the message contains a password
// reset link (verified empirically: an identical email sent via nodemailer
// gets through). This bypasses hasura-auth's mailer for this one flow,
// reusing its ticket mechanism (auth.users.ticket / ticketExpiresAt) so the
// existing /v1/verify + AuthProvider refreshToken flow keeps working
// unchanged, and sends the email ourselves with the transport already
// proven to work for invites.

const TICKET_VALIDITY_MS = 60 * 60 * 1000 // Matches hasura-auth's own default

interface UserForReset {
  id: string
  disabled: boolean
  locale: string
  displayName: string
  ticketExpiresAt: string | null
}

const GET_USER_BY_EMAIL = parse(`
  query getUserByEmailForPasswordReset($email: citext!) {
    users(where: { email: { _eq: $email } }) {
      id
      disabled
      locale
      displayName
      ticketExpiresAt
    }
  }
`) as unknown as TypedDocumentNode<{ users: UserForReset[] }, { email: string }>

const SET_USER_TICKET = parse(`
  mutation setUserPasswordResetTicket(
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
    subject: 'Réinitialiser votre mot de passe',
    heading: 'Changement de mot de passe',
    intro:
      "Vous avez fait une demande de réinitialisation de votre mot de passe Rolebase. Si vous n'êtes pas à l'origine de cette demande, ignorez ce message.",
    cta: 'Changer mon mot de passe',
  },
  en: {
    subject: 'Reset your password',
    heading: 'Password change',
    intro:
      'You have requested to reset your Rolebase password. If you did not make this request, please ignore this message.',
    cta: 'Change my password',
  },
}

function getContent(locale: string) {
  return locale === 'fr' ? content.fr : content.en
}

// Public: called from the "forgot password" page, before any session exists
export default publicProcedure
  .input(
    yup.object().shape({
      email: emailSchema.required(),
      redirectTo: yup.string().url().required(),
    })
  )
  .mutation(async (opts): Promise<void> => {
    const { email, redirectTo } = opts.input

    const { users } = await adminRequest(GET_USER_BY_EMAIL, { email })
    const user = users[0]

    // Same response whether the account exists or not: never reveal it
    if (!user || user.disabled) return

    // A ticket was already issued less than a minute ago: skip, to avoid
    // flooding the mailbox on repeated submits
    if (
      user.ticketExpiresAt &&
      new Date(user.ticketExpiresAt).getTime() - Date.now() >
        TICKET_VALIDITY_MS - 60_000
    ) {
      return
    }

    const ticket = `passwordReset:${randomUUID()}`
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
    )}&type=passwordReset&redirectTo=${encodeURIComponent(redirectTo)}`

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
