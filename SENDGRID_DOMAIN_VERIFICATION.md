# SendGrid Domain Verification Guide

## Current Issue
The email service is configured but emails are failing to send. Based on the configuration:
- Sender email: `noreply@seoauditer.netlify.app`
- SendGrid API key is properly set
- Email routes are accessible

## Solution: Domain Authentication

### Option 1: Use a Verified Single Sender (Quick Fix)
1. Log in to your SendGrid account
2. Go to Settings → Sender Authentication
3. Click "Verify a Single Sender" 
4. Add an email address you control (e.g., your personal email)
5. Verify the email through the confirmation link
6. Update the Railway environment variable:
   ```
   EMAIL_FROM_ADDRESS=your-verified-email@example.com
   ```

### Option 2: Authenticate Your Domain (Recommended)
Since you're using `seoauditer.netlify.app`, you'll need to:

1. **In SendGrid:**
   - Go to Settings → Sender Authentication
   - Click "Authenticate Your Domain"
   - Enter domain: `seoauditer.netlify.app`
   - SendGrid will provide DNS records to add

2. **In Netlify:**
   - Go to your site settings
   - Navigate to Domain Management → DNS Records
   - Add the CNAME records provided by SendGrid:
     - Usually 3 CNAME records for domain authentication
     - 2 additional CNAME records for link branding (optional)

3. **Verify in SendGrid:**
   - After adding DNS records, return to SendGrid
   - Click "Verify" to check the DNS records
   - Once verified, emails from `noreply@seoauditer.netlify.app` will work

### Option 3: Use a Different Domain
If you have another domain with easier DNS access:
1. Update Railway environment variable:
   ```
   EMAIL_FROM_ADDRESS=noreply@yourdomain.com
   ```
2. Follow the domain authentication steps for that domain

## Testing After Verification

Once domain/sender is verified, test using:
```bash
curl -X POST https://seoauditer-production.up.railway.app/api/email/test \
  -H "Content-Type: application/json" \
  -d '{"to": "your-email@example.com", "type": "welcome"}'
```

## Monitoring
- Check Railway logs for detailed error messages
- Monitor SendGrid Activity Feed for email status
- Use the `/api/email/health` endpoint to verify configuration

## Environment Variables to Verify
- `SENDGRID_API_KEY` - Should start with "SG."
- `EMAIL_FROM_ADDRESS` - Must be a verified sender
- `EMAIL_FROM_NAME` - Optional, defaults to "SEO Director"
- `EMAIL_PROVIDER` - Should be "sendgrid"