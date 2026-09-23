import * as dotenv from 'dotenv'
dotenv.config()

export default {
  sender: {
    name: 'Rolebase.io',
    email: 'noreply@rolebase.io',
  },

  mailjet: {
    public: process.env.MAILJET_PUBIC_KEY || '',
    private: process.env.MAILJET_PRIVATE_KEY || '',
  },

  smtp: {
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    sender: process.env.SMTP_SENDER || '',
  },
}
