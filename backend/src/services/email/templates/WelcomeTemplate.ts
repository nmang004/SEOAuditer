import { BaseTemplate } from './BaseTemplate';

export class WelcomeTemplate extends BaseTemplate {
  render(data: Record<string, any>): { subject: string; html: string; text: string } {
    this.validateData(data, ['name', 'verificationUrl', 'appName']);

    const { name, verificationUrl, appName, appUrl } = data;

    const subject = `Welcome to ${appName}! Please verify your email`;

    const content = `
      <div class="title">Welcome to ${appName}!</div>
      <div class="subtitle">Let's get your account verified and ready to go</div>
      
      <div class="content">
        <p>Hi ${name},</p>
        
        <p>Thank you for joining ${appName}! We're excited to help you take your SEO to the next level.</p>
        
        <p>To get started, please verify your email address by clicking the button below:</p>
      </div>

      <div class="button-container">
        <a href="${this.generateTrackedLink(verificationUrl, 'welcome_email')}" class="button">
          Verify Email Address
        </a>
      </div>

      <div class="content">
        <p>This verification link will expire in 24 hours for security reasons.</p>
        
        <div class="highlight-box">
          <strong>What happens next?</strong><br>
          Once verified, you'll be able to:
          <ul style="margin: 12px 0; padding-left: 20px; color: ${this.brandColors.textSecondary};">
            <li>Create your first SEO project</li>
            <li>Run comprehensive website audits</li>
            <li>Track your SEO performance</li>
            <li>Get actionable recommendations</li>
          </ul>
        </div>

        <p>If you didn't create this account, you can safely ignore this email.</p>
      </div>

      <hr class="divider">

      <div class="content">
        <p style="font-size: 14px; color: ${this.brandColors.textMuted};">
          <strong>Having trouble with the button?</strong><br>
          Copy and paste this link into your browser:<br>
          <a href="${verificationUrl}" style="color: ${this.brandColors.primaryLight}; word-break: break-all;">${verificationUrl}</a>
        </p>
      </div>
    `;

    const html = this.generateHTML(content, { ...data, subject, email: data.email });

    const text = `
Welcome to ${appName}!

Hi ${name},

Thank you for joining ${appName}! We're excited to help you take your SEO to the next level.

To get started, please verify your email address by visiting:
${verificationUrl}

This verification link will expire in 24 hours for security reasons.

What happens next?
Once verified, you'll be able to:
• Create your first SEO project
• Run comprehensive website audits  
• Track your SEO performance
• Get actionable recommendations

If you didn't create this account, you can safely ignore this email.

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