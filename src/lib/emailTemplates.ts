type InvitationEmailData = {
  candidateEmail: string;
  assessmentTitle: string;
  companyName: string;
  invitationToken: string;
  expiresAt: Date;
};

export const buildInvitationEmail = (data: InvitationEmailData) => {
  const acceptUrl = `${process.env.FRONTEND_URL ?? "http://localhost:3000"}/invitations/${data.invitationToken}/accept`;
  const expiryDate = data.expiresAt.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const subject = `You've been invited to take the "${data.assessmentTitle}" assessment`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
  <style>
    body { margin: 0; padding: 0; background: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    .wrapper { max-width: 560px; margin: 40px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,.08); }
    .header { background: #1d4ed8; padding: 32px 40px; }
    .header h1 { margin: 0; color: #ffffff; font-size: 22px; font-weight: 700; }
    .body { padding: 32px 40px; color: #374151; font-size: 15px; line-height: 1.6; }
    .body p { margin: 0 0 16px; }
    .cta { display: inline-block; margin: 8px 0 24px; padding: 12px 28px; background: #1d4ed8; color: #ffffff !important; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px; }
    .detail-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 16px 20px; margin: 0 0 20px; }
    .detail-box p { margin: 4px 0; font-size: 14px; }
    .detail-box strong { color: #111827; }
    .token-box { background: #fefce8; border: 1px solid #fde047; border-radius: 6px; padding: 14px 20px; margin: 0 0 20px; word-break: break-all; font-size: 13px; color: #713f12; }
    .footer { padding: 20px 40px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; text-align: center; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>Assessment Invitation</h1>
    </div>
    <div class="body">
      <p>Hi <strong>${data.candidateEmail}</strong>,</p>
      <p><strong>${data.companyName}</strong> has invited you to complete an assessment as part of their hiring process.</p>

      <div class="detail-box">
        <p><strong>Assessment:</strong> ${data.assessmentTitle}</p>
        <p><strong>Company:</strong> ${data.companyName}</p>
        <p><strong>Expires:</strong> ${expiryDate}</p>
      </div>

      <p>Click the button below to accept your invitation and begin when you are ready. The link expires on <strong>${expiryDate}</strong>.</p>

      <a href="${acceptUrl}" class="cta">Accept Invitation</a>

      <p>If the button above does not work, copy and paste this URL into your browser:</p>
      <div class="token-box">${acceptUrl}</div>

      <p>If you were not expecting this invitation or believe this was sent in error, you can safely ignore this email.</p>
    </div>
    <div class="footer">
      <p>This email was sent by the Developer Assessment Platform on behalf of ${data.companyName}.</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  return { subject, html };
};
