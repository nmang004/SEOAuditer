# SendGrid Email Setup for Railway Deployment

This guide will help you set up SendGrid email service for your Railway deployment.

## 1. Railway Environment Variables

Add these environment variables to your Railway project:

### Required Email Variables
```bash
# Email Configuration
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=your_sendgrid_api_key_here
EMAIL_FROM_ADDRESS=noreply@seoauditer.netlify.app
EMAIL_FROM_NAME=SEO Director

# App Configuration
APP_NAME=SEO Director
APP_URL=https://seoauditer.netlify.app
SUPPORT_EMAIL=support@seoauditer.netlify.app
```

**Note:** Replace `your_sendgrid_api_key_here` with your actual SendGrid API key (starts with `SG.`)

### How to Add Variables to Railway

1. Go to your Railway project dashboard
2. Click on your backend service
3. Go to the "Variables" tab
4. Add each variable one by one:
   - Click "New Variable"
   - Enter the variable name and value
   - Click "Add"

## 2. SendGrid Account Setup

### Verify Your Sender Identity

1. Log into your SendGrid dashboard
2. Go to Settings → Sender Authentication
3. Choose one option:

#### Option A: Single Sender Verification (Quick Setup)
- Click "Create a Sender"
- Use: `noreply@seoauditer.netlify.app`
- Fill out the form with your information
- Verify the email address when you receive the confirmation

#### Option B: Domain Authentication (Recommended for Production)
- Click "Authenticate Your Domain"
- Enter `seoauditer.netlify.app` (or your custom domain)
- Follow DNS setup instructions
- This improves deliverability significantly

### Test Your Setup

After adding the environment variables to Railway:

1. Deploy your backend
2. Test the email service:
   ```bash
   curl https://your-railway-backend.railway.app/api/email/health
   ```

3. Send a test email (development only):
   ```bash
   curl -X POST https://your-railway-backend.railway.app/api/email/test \
     -H "Content-Type: application/json" \
     -d '{"to": "your-email@example.com", "type": "welcome"}'
   ```

## 3. Email Templates

The system includes professional, branded email templates:

- **Welcome/Verification Email**: Sent when users register
- **Password Reset Email**: Sent for password reset requests
- **Password Changed Email**: Sent when password is successfully changed
- **Email Change Verification**: Sent when users change their email

All templates feature:
- Your brand colors (indigo/purple theme)
- Mobile-responsive design
- Professional styling
- Clear call-to-action buttons
- Security best practices

## 4. Monitoring Email Delivery

### View Email Statistics
```bash
GET /api/email/stats
```

### Check Email Service Health
```bash
GET /api/email/health
```

### SendGrid Dashboard
- Log into SendGrid to view:
  - Delivery statistics
  - Open/click rates
  - Bounces and spam reports
  - Suppression lists

## 5. Troubleshooting

### Common Issues

1. **"Authentication failed" Error**
   - Check that SENDGRID_API_KEY is correct
   - Ensure API key has "Mail Send" permissions

2. **"Sender verification required" Error**
   - Complete sender authentication in SendGrid
   - Verify the EMAIL_FROM_ADDRESS matches verified sender

3. **Emails going to spam**
   - Set up domain authentication
   - Warm up your sending reputation gradually
   - Follow email best practices

4. **Template not loading**
   - Check backend logs for template errors
   - Ensure all required template data is provided

### Debug Steps

1. Check email service health:
   ```bash
   curl https://your-backend.railway.app/api/email/health
   ```

2. Check Railway logs:
   - Go to Railway dashboard
   - Click on your service
   - View "Deployments" tab
   - Click on latest deployment to see logs

3. Test with mock provider first:
   - Temporarily set `EMAIL_PROVIDER=mock`
   - Check if emails are logged in backend
   - Switch back to `sendgrid` once confirmed working

## 6. Production Best Practices

1. **Sender Reputation**
   - Start with low email volumes
   - Gradually increase sending
   - Monitor bounce rates (keep <5%)

2. **Email Content**
   - Use professional, branded templates
   - Include unsubscribe links
   - Keep HTML clean and mobile-friendly

3. **Monitoring**
   - Set up SendGrid webhooks for delivery events
   - Monitor email metrics regularly
   - Implement proper error handling

4. **Security**
   - Keep API keys secure
   - Use environment variables only
   - Rotate keys periodically
   - Monitor for unusual sending patterns

## 7. Cost Management

**SendGrid Free Tier:**
- 100 emails/day forever
- Perfect for MVP and initial testing
- No credit card required

**Scaling:**
- Monitor your usage in SendGrid dashboard
- Upgrade when approaching limits
- $19.95/month for 50,000 emails

Your current setup should handle hundreds of users comfortably within the free tier.