const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

function layout(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5; }
    .container { max-width: 560px; margin: 0 auto; padding: 40px 20px; }
    .card { background: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
    .logo { font-size: 20px; font-weight: 700; color: #6366f1; margin-bottom: 24px; }
    h1 { font-size: 20px; font-weight: 600; color: #18181b; margin: 0 0 12px; }
    p { font-size: 14px; color: #52525b; line-height: 1.6; margin: 0 0 16px; }
    .btn { display: inline-block; padding: 10px 24px; background: #6366f1; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-size: 14px; font-weight: 500; }
    .footer { text-align: center; margin-top: 24px; font-size: 12px; color: #a1a1aa; }
    .meta { font-size: 13px; color: #71717a; background: #f4f4f5; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="logo">Devlogify</div>
      ${content}
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Devlogify</p>
    </div>
  </div>
</body>
</html>`
}

export function invitationEmailTemplate(params: {
  companyName: string
  inviterName: string
  role: string
  token: string
  expiresAt: string
}): { subject: string; html: string } {
  const inviteUrl = `${BASE_URL}/invite/${params.token}`
  const expiryDate = new Date(params.expiresAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return {
    subject: `You've been invited to join ${params.companyName} on Devlogify`,
    html: layout(`
      <h1>You're invited!</h1>
      <p><strong>${params.inviterName}</strong> has invited you to join <strong>${params.companyName}</strong> as a <strong>${params.role}</strong>.</p>
      <div class="meta">
        <strong>Company:</strong> ${params.companyName}<br>
        <strong>Role:</strong> ${params.role}<br>
        <strong>Expires:</strong> ${expiryDate}
      </div>
      <p><a href="${inviteUrl}" class="btn">Accept Invitation</a></p>
      <p style="margin-top: 20px; font-size: 12px; color: #a1a1aa;">If the button doesn't work, copy and paste this link: ${inviteUrl}</p>
    `),
  }
}

export function notificationEmailTemplate(params: {
  title: string
  message: string
  type: string
}): { subject: string; html: string } {
  return {
    subject: `[Devlogify] ${params.title}`,
    html: layout(`
      <h1>${params.title}</h1>
      <p>${params.message}</p>
      <p><a href="${BASE_URL}/dashboard" class="btn">Open Devlogify</a></p>
    `),
  }
}
