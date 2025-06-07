import { BaseTemplate } from './BaseTemplate';

export class EmailChangeTemplate extends BaseTemplate {
  render(data: Record<string, any>): { subject: string; html: string; text: string } {
    this.validateData(data, ['name', 'verificationUrl', 'appName']);

    const { name, verificationUrl, appName, appUrl, oldEmail, newEmail } = data;

    const subject = `Verify your new email address for ${appName}`;

    const content = `
      <div class="title">Email Address Change</div>
      <div class="subtitle">Please verify your new email address</div>
      
      <div class="content">
        <p>Hi ${name},</p>
        
        <p>You recently requested to change the email address associated with your ${appName} account.</p>
        
        ${oldEmail && newEmail ? `
        <div class="highlight-box">
          <strong>Email Change Request:</strong><br>
          <strong>From:</strong> ${oldEmail}<br>
          <strong>To:</strong> ${newEmail}
        </div>
        ` : ''}
        
        <p>To complete this change, please verify your new email address by clicking the button below:</p>
      </div>

      <div class="button-container">
        <a href="${this.generateTrackedLink(verificationUrl, 'email_change_verification')}" class="button">
          Verify New Email Address
        </a>
      </div>

      <div class="content">
        <div class="warning-box">
          <strong>⏰ Important:</strong><br>
          This verification link will expire in 24 hours. After verification, you'll need to use your new email address to log in.
        </div>

        <p>If you didn't request this email change, please ignore this email and contact our support team immediately.</p>
        
        <div class="highlight-box">
          <strong>What happens next?</strong>
          <ul style="margin: 12px 0; padding-left: 20px; color: ${this.brandColors.textSecondary};">
            <li>Click the verification button above</li>
            <li>Your email address will be updated</li>
            <li>You'll receive a confirmation email</li>
            <li>Use your new email for future logins</li>
          </ul>
        </div>
      </div>

      <hr class="divider">

      <div class="content">
        <p style="font-size: 14px; color: ${this.brandColors.textMuted};">
          <strong>Having trouble with the button?</strong><br>
          Copy and paste this link into your browser:<br>
          <a href="${verificationUrl}" style="color: ${this.brandColors.primaryLight}; word-break: break-all;">${verificationUrl}</a>
        </p>
        
        <p style="font-size: 14px; color: ${this.brandColors.textMuted};">
          <strong>Security Note:</strong> This email was sent to your new email address to verify you have access to it. 
          Your account will continue to use your current email address until verification is complete.
        </p>
      </div>
    `;

    const html = this.generateHTML(content, { ...data, subject, email: newEmail || data.email });

    const text = `
Email Address Change

Hi ${name},

You recently requested to change the email address associated with your ${appName} account.

${oldEmail && newEmail ? `
Email Change Request:
From: ${oldEmail}
To: ${newEmail}
` : ''}

To complete this change, please verify your new email address by visiting:
${verificationUrl}

⏰ Important: This verification link will expire in 24 hours. After verification, you'll need to use your new email address to log in.

If you didn't request this email change, please ignore this email and contact our support team immediately.

What happens next?
• Click the verification link above
• Your email address will be updated
• You'll receive a confirmation email
• Use your new email for future logins

Security Note: This email was sent to your new email address to verify you have access to it. Your account will continue to use your current email address until verification is complete.

Best regards,
The ${appName} Team

---
${appName}
${appUrl}

© ${new Date().getFullYear()} ${appName}. All rights reserved.
    `.trim();

    return { subject, html, text };
  }
}