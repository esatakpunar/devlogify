import { Resend } from 'resend'

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Devlogify <noreply@devlogify.com>'

let resend: Resend | null = null

function getResendClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY)
  }
  return resend
}

export interface SendEmailParams {
  to: string
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: SendEmailParams) {
  const client = getResendClient()

  if (!client) {
    console.warn('[Email] RESEND_API_KEY not configured, skipping email send')
    return { success: false, error: 'RESEND_API_KEY not configured' }
  }

  try {
    const { data, error } = await client.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    })

    if (error) {
      console.error('[Email] Failed to send:', error)
      return { success: false, error: error.message }
    }

    return { success: true, id: data?.id }
  } catch (err: any) {
    console.error('[Email] Error:', err)
    return { success: false, error: err.message }
  }
}
