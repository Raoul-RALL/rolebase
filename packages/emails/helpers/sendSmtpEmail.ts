import { createTransport } from 'nodemailer'
import settings from '../settings'
import { EmailMessage } from './sendEmail'

export async function sendSmtpEmail(...messages: EmailMessage[]) {
  const transporter = createTransport({
    host: settings.smtp.host,
    port: settings.smtp.port,
    secure: settings.smtp.secure,
    auth: {
      user: settings.smtp.user,
      pass: settings.smtp.pass,
    },
  })

  for (const message of messages) {
    await transporter.sendMail({
      from: `"${message.From.Name}" <${settings.smtp.sender}>`,
      to: message.To.map((r) => `"${r.Name}" <${r.Email}>`).join(', '),
      subject: message.Subject,
      html: message.HTMLPart,
      text: message.TextPart,
      headers: {
        'Auto-Submitted': 'auto-generated',
      },
    })
  }
}
