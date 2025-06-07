import { BaseTemplate } from './BaseTemplate';

export class PasswordChangedTemplate extends BaseTemplate {
  render(data: Record<string, any>): { subject: string; html: string; text: string } {
    this.validateData(data, ['name', 'appName']);

    const { name, appName, appUrl, supportEmail = 'support@yourdomain.com' } = data;
    const changeTime = new Date().toLocaleString('en-US', {
      timeZone: 'UTC',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });

    const subject = `Your ${appName} password has been changed`;

    const content = `
      <div class="title">Password Changed Successfully</div>
      <div class="subtitle">Your account password has been updated</div>
      
      <div class="content">
        <p>Hi ${name},</p>
        
        <p>This email confirms that your ${appName} account password was successfully changed.</p>
        
        <div class="success-box">
          <strong>✅ Password Updated</strong><br>
          <strong>Time:</strong> ${changeTime}<br>
          <strong>Account:</strong> ${data.email || 'Your account'}
        </div>

        <p>If you made this change, no further action is required.</p>
      </div>

      <div class="content">
        <div class="warning-box">
          <strong>⚠️ Didn't change your password?</strong><br>
          If you didn't make this change, your account may have been compromised. Please take these steps immediately:
          <ul style="margin: 12px 0; padding-left: 20px; color: ${this.brandColors.text};">
            <li>Reset your password again using a secure device</li>
            <li>Review your account activity</li>
            <li>Contact our support team</li>
            <li>Consider enabling two-factor authentication</li>
          </ul>
        </div>
      </div>

      <div class="button-container">
        <a href="${this.generateTrackedLink(appUrl + '/dashboard', 'password_changed_email')}" class="button">
          Go to Dashboard
        </a>
      </div>

      <div class="content">
        <div class="highlight-box">
          <strong>🔐 Account Security Tips:</strong>
          <ul style="margin: 12px 0; padding-left: 20px; color: ${this.brandColors.textSecondary};">
            <li>Use a unique password for your ${appName} account</li>
            <li>Enable two-factor authentication for extra security</li>
            <li>Never share your password with anyone</li>
            <li>Log out of shared or public devices</li>
            <li>Monitor your account for unusual activity</li>
          </ul>
        </div>
      </div>

      <hr class="divider">

      <div class="content">
        <p style="font-size: 14px; color: ${this.brandColors.textMuted};">
          <strong>Need help?</strong><br>
          If you have any questions or concerns about your account security, 
          please contact our support team at <a href="mailto:${supportEmail}" style="color: ${this.brandColors.primaryLight};">${supportEmail}</a>
        </p>
      </div>
    `;

    const html = this.generateHTML(content, { ...data, subject, email: data.email });

    const text = `
Password Changed Successfully

Hi ${name},

This email confirms that your ${appName} account password was successfully changed.

✅ Password Updated
Time: ${changeTime}
Account: ${data.email || 'Your account'}

If you made this change, no further action is required.

⚠️ Didn't change your password?
If you didn't make this change, your account may have been compromised. Please take these steps immediately:
• Reset your password again using a secure device
• Review your account activity
• Contact our support team
• Consider enabling two-factor authentication

🔐 Account Security Tips:
• Use a unique password for your ${appName} account
• Enable two-factor authentication for extra security
• Never share your password with anyone
• Log out of shared or public devices
• Monitor your account for unusual activity

Need help?
If you have any questions or concerns about your account security, please contact our support team at ${supportEmail}

Go to Dashboard: ${appUrl}/dashboard

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