import { BaseTemplate } from './BaseTemplate';

export class PasswordResetTemplate extends BaseTemplate {
  render(data: Record<string, any>): { subject: string; html: string; text: string } {
    this.validateData(data, ['name', 'resetUrl', 'appName']);

    const { name, resetUrl, appName, appUrl } = data;

    const subject = `Reset your ${appName} password`;

    const content = `
      <div class="title">Password Reset Request</div>
      <div class="subtitle">We received a request to reset your password</div>
      
      <div class="content">
        <p>Hi ${name},</p>
        
        <p>We received a request to reset the password for your ${appName} account.</p>
        
        <p>If you requested this password reset, click the button below to create a new password:</p>
      </div>

      <div class="button-container">
        <a href="${this.generateTrackedLink(resetUrl, 'password_reset_email')}" class="button">
          Reset Password
        </a>
      </div>

      <div class="content">
        <div class="warning-box">
          <strong>⏰ Important:</strong><br>
          This password reset link will expire in 1 hour for your security.
        </div>

        <p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
        
        <div class="highlight-box">
          <strong>Security Tips:</strong>
          <ul style="margin: 12px 0; padding-left: 20px; color: ${this.brandColors.textSecondary};">
            <li>Use a strong, unique password</li>
            <li>Include uppercase, lowercase, numbers, and symbols</li>
            <li>Make it at least 12 characters long</li>
            <li>Don't reuse passwords from other accounts</li>
          </ul>
        </div>
      </div>

      <hr class="divider">

      <div class="content">
        <p style="font-size: 14px; color: ${this.brandColors.textMuted};">
          <strong>Having trouble with the button?</strong><br>
          Copy and paste this link into your browser:<br>
          <a href="${resetUrl}" style="color: ${this.brandColors.primaryLight}; word-break: break-all;">${resetUrl}</a>
        </p>
        
        <p style="font-size: 14px; color: ${this.brandColors.textMuted};">
          If you continue to have problems, please contact our support team.
        </p>
      </div>
    `;

    const html = this.generateHTML(content, { ...data, subject, email: data.email });

    const text = `
Password Reset Request

Hi ${name},

We received a request to reset the password for your ${appName} account.

If you requested this password reset, visit this link to create a new password:
${resetUrl}

⏰ Important: This password reset link will expire in 1 hour for your security.

If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.

Security Tips:
• Use a strong, unique password
• Include uppercase, lowercase, numbers, and symbols  
• Make it at least 12 characters long
• Don't reuse passwords from other accounts

If you continue to have problems, please contact our support team.

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