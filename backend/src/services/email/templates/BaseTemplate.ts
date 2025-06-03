import { EmailTemplate } from '../EmailService';

export abstract class BaseTemplate implements EmailTemplate {
  protected brandColors = {
    primary: '#6366f1',      // indigo-500
    primaryLight: '#818cf8', // indigo-400
    primaryDark: '#4f46e5',  // indigo-600
    secondary: '#8b5cf6',    // purple-500
    accent: '#ec4899',       // pink-500
    background: '#0F172A',   // dark navy
    surface: '#1A202C',      // secondary background
    text: '#ffffff',         // white
    textSecondary: '#d1d5db', // gray-300
    textMuted: '#6b7280',    // gray-500
    success: '#10b981',      // green-500
    warning: '#f59e0b',      // amber-500
    error: '#ef4444'         // red-500
  };

  abstract render(data: Record<string, any>): {
    subject: string;
    html: string;
    text: string;
  };

  /**
   * Generate the base HTML structure with consistent styling
   */
  protected generateHTML(content: string, data: Record<string, any>): string {
    const { appName = 'SEO Director', appUrl = 'https://seoauditer.netlify.app' } = data;
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${data.subject || 'Email from ' + appName}</title>
    <!--[if mso]>
    <noscript>
        <xml>
            <o:OfficeDocumentSettings>
                <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
        </xml>
    </noscript>
    <![endif]-->
    <style>
        /* Reset styles */
        body, table, td, p, a, li, blockquote {
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
        }
        table, td {
            mso-table-lspace: 0pt;
            mso-table-rspace: 0pt;
        }
        img {
            -ms-interpolation-mode: bicubic;
            border: 0;
            height: auto;
            line-height: 100%;
            outline: none;
            text-decoration: none;
        }

        /* Base styles */
        body {
            background-color: ${this.brandColors.background};
            color: ${this.brandColors.text};
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            font-size: 16px;
            line-height: 1.6;
            margin: 0;
            padding: 0;
            width: 100%;
        }

        .email-container {
            background-color: ${this.brandColors.background};
            width: 100%;
            padding: 40px 0;
        }

        .email-content {
            background-color: ${this.brandColors.surface};
            border-radius: 12px;
            margin: 0 auto;
            max-width: 600px;
            padding: 40px;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .header {
            text-align: center;
            margin-bottom: 40px;
        }

        .logo {
            background: linear-gradient(135deg, ${this.brandColors.primary}, ${this.brandColors.secondary});
            color: white;
            font-size: 24px;
            font-weight: bold;
            padding: 12px 24px;
            border-radius: 8px;
            display: inline-block;
            text-decoration: none;
            margin-bottom: 20px;
        }

        .title {
            color: ${this.brandColors.text};
            font-size: 28px;
            font-weight: bold;
            margin: 0 0 16px 0;
            line-height: 1.3;
        }

        .subtitle {
            color: ${this.brandColors.textSecondary};
            font-size: 18px;
            margin: 0 0 32px 0;
        }

        .content {
            color: ${this.brandColors.textSecondary};
            font-size: 16px;
            line-height: 1.6;
            margin-bottom: 32px;
        }

        .button {
            background: linear-gradient(135deg, ${this.brandColors.primary}, ${this.brandColors.secondary});
            border-radius: 8px;
            color: white !important;
            display: inline-block;
            font-size: 16px;
            font-weight: 600;
            padding: 16px 32px;
            text-align: center;
            text-decoration: none;
            margin: 16px 0;
            transition: all 0.2s ease;
        }

        .button:hover {
            background: linear-gradient(135deg, ${this.brandColors.primaryDark}, ${this.brandColors.secondary});
            transform: translateY(-1px);
        }

        .button-container {
            text-align: center;
            margin: 32px 0;
        }

        .footer {
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            margin-top: 40px;
            padding-top: 32px;
            text-align: center;
        }

        .footer-text {
            color: ${this.brandColors.textMuted};
            font-size: 14px;
            line-height: 1.5;
            margin: 8px 0;
        }

        .footer-links {
            margin: 16px 0;
        }

        .footer-link {
            color: ${this.brandColors.primaryLight};
            text-decoration: none;
            margin: 0 12px;
        }

        .footer-link:hover {
            color: ${this.brandColors.primary};
            text-decoration: underline;
        }

        .divider {
            border: none;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            margin: 32px 0;
        }

        .highlight-box {
            background-color: rgba(99, 102, 241, 0.1);
            border: 1px solid rgba(99, 102, 241, 0.2);
            border-radius: 8px;
            padding: 20px;
            margin: 24px 0;
        }

        .warning-box {
            background-color: rgba(245, 158, 11, 0.1);
            border: 1px solid rgba(245, 158, 11, 0.2);
            border-radius: 8px;
            padding: 20px;
            margin: 24px 0;
        }

        .success-box {
            background-color: rgba(16, 185, 129, 0.1);
            border: 1px solid rgba(16, 185, 129, 0.2);
            border-radius: 8px;
            padding: 20px;
            margin: 24px 0;
        }

        /* Mobile responsiveness */
        @media only screen and (max-width: 600px) {
            .email-content {
                padding: 20px;
                margin: 0 16px;
            }
            
            .title {
                font-size: 24px;
            }
            
            .subtitle {
                font-size: 16px;
            }
            
            .button {
                display: block;
                width: 100%;
                padding: 16px;
            }
        }

        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
            .email-container {
                background-color: ${this.brandColors.background};
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="email-content">
            <div class="header">
                <a href="${appUrl}" class="logo">${appName}</a>
            </div>
            
            ${content}
            
            <div class="footer">
                <div class="footer-links">
                    <a href="${appUrl}" class="footer-link">Visit Website</a>
                    <a href="${appUrl}/support" class="footer-link">Support</a>
                    <a href="${appUrl}/privacy" class="footer-link">Privacy</a>
                </div>
                <div class="footer-text">
                    © ${new Date().getFullYear()} ${appName}. All rights reserved.
                </div>
                <div class="footer-text">
                    This email was sent to ${data.email || 'you'} because you have an account with us.
                </div>
                <div class="footer-text">
                    <a href="${appUrl}/unsubscribe?email=${encodeURIComponent(data.email || '')}" class="footer-link">Unsubscribe</a>
                </div>
            </div>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Convert HTML to plain text
   */
  protected htmlToText(html: string): string {
    return html
      .replace(/<style[^>]*>.*?<\/style>/gis, '')
      .replace(/<script[^>]*>.*?<\/script>/gis, '')
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .trim();
  }

  /**
   * Generate a safe link with tracking
   */
  protected generateTrackedLink(url: string, source: string = 'email'): string {
    const urlObj = new URL(url);
    urlObj.searchParams.set('utm_source', source);
    urlObj.searchParams.set('utm_medium', 'email');
    return urlObj.toString();
  }

  /**
   * Validate required data fields
   */
  protected validateData(data: Record<string, any>, requiredFields: string[]): void {
    const missing = requiredFields.filter(field => !data[field]);
    if (missing.length > 0) {
      throw new Error(`Missing required template data: ${missing.join(', ')}`);
    }
  }
}