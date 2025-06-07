# Quick Start Guide

Get up and running with Rival Outranker in under 10 minutes! This guide will walk you through creating your first project and running your first SEO analysis.

## 🎯 Prerequisites

Before starting, ensure you have:

- ✅ Completed the [Installation Guide](installation.md)
- ✅ Application running (Frontend + Backend + Database)
- ✅ Sample data seeded (optional but recommended)

## 🚀 5-Minute Quick Start

### Step 1: Access the Application

Open your browser and navigate to:

- **Application**: <http://localhost:3000>
- **API Health**: <http://localhost:4000/health>

You should see the Rival Outranker dashboard loading screen.

### Step 2: Create Your Account

1. **Register a new account**:

   ```bash
   # Via API (testing)
   curl -X POST http://localhost:4000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "email": "demo@example.com",
       "password": "SecurePassword123!",
       "name": "Demo User"
     }'
   ```

2. **Or use the web interface**:
   - Click "Sign Up" on the homepage
   - Fill in your details
   - Verify your email (if email service is configured)

### Step 3: Login and Explore

1. **Login to your account**:
   - Navigate to <http://localhost:3000/login>
   - Enter your credentials
   - You'll be redirected to the dashboard

2. **Dashboard Overview**:
   - View your project statistics
   - Check recent activity
   - Explore navigation menu

### Step 4: Create Your First Project

1. **Navigate to Projects**:
   - Click "Projects" in the sidebar
   - Click "Create New Project" button

2. **Project Details**:

   ```
   Project Name: My First Website
   URL: https://example.com
   Description: Testing Rival Outranker (optional)
   ```

3. **Save the Project**:
   - Click "Create Project"
   - You'll see your project in the projects list

### Step 5: Run Your First Analysis

1. **Start Analysis**:
   - Click on your newly created project
   - Click "Start New Analysis" button
   - The analysis will begin automatically

2. **Monitor Progress** (Real-time):
   - Watch the progress bar update
   - View real-time status updates
   - See analysis stages: Crawling → Analyzing → Generating Report

3. **View Results**:
   - Analysis typically takes 2-5 minutes
   - Navigate through different report sections:
     - **Overview**: Overall SEO score and summary
     - **Technical**: Technical SEO issues
     - **Content**: Content quality analysis
     - **On-Page**: On-page optimization
     - **Performance**: Page speed and Core Web Vitals

## 📊 Understanding Your First Report

### SEO Score Breakdown

Your analysis provides scores in 4 key areas:

```
📈 Overall Score: 85/100
├── 🔧 Technical SEO: 90/100
├── 📝 Content Quality: 80/100  
├── 🎯 On-Page SEO: 85/100
└── ⚡ Performance: 88/100
```

### Common Issues You'll See

**Technical Issues**:

- Missing meta descriptions
- Broken internal links
- Missing alt attributes
- Slow page load times

**Content Issues**:

- Thin content pages
- Duplicate content
- Missing heading structure
- Low keyword density

**Performance Issues**:

- Large image files
- Unoptimized JavaScript
- Missing browser caching
- Slow server response

### Priority Recommendations

Focus on these high-impact improvements first:

1. **🚨 Critical Issues**: Fix broken links, missing meta tags
2. **⚠️ High Priority**: Optimize images, improve page speed
3. **📝 Medium Priority**: Enhance content quality
4. **💡 Low Priority**: Minor technical optimizations

## 🎮 Interactive Demo Features

### Real-Time Updates

Watch your dashboard update in real-time:

1. **Open Multiple Tabs**:
   - Tab 1: Dashboard overview
   - Tab 2: Project details
   - Tab 3: Analysis in progress

2. **Start an Analysis**:
   - All tabs will update simultaneously
   - See live progress and notifications
   - Experience WebSocket-powered updates

### Sample Data Exploration

If you seeded sample data, explore:

```bash
# View sample projects
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:4000/api/projects

# View sample analyses
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:4000/api/dashboard/stats
```

### API Testing

Test the API directly:

```bash
# Health check
curl http://localhost:4000/health

# Get user profile
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:4000/api/auth/me

# Get dashboard stats
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:4000/api/dashboard/stats
```

## 🔗 WebSocket Connection Testing

Test real-time features:

```javascript
// Browser console test
const socket = io('http://localhost:4000', {
  auth: { token: 'YOUR_JWT_TOKEN' }
});

socket.on('connect', () => {
  console.log('Connected to WebSocket');
});

socket.on('analysis:progress', (data) => {
  console.log('Analysis progress:', data);
});

// Join a project room
socket.emit('join:project', 'your-project-id');
```

## 📱 Mobile Experience

Test the Progressive Web App (PWA):

1. **Mobile Browser**:
   - Open <http://localhost:3000> on mobile
   - Notice responsive design
   - Test touch interactions

2. **Install as App**:
   - Look for "Add to Home Screen" prompt
   - Install the PWA
   - Use as native app

## 🧪 Testing Different Scenarios

### Test Various Website Types

Try analyzing different types of websites:

```bash
# E-commerce site
Project: Online Store Analysis
URL: https://demo-ecommerce-site.com

# Blog/Content site  
Project: Blog Analysis
URL: https://medium.com/@yourusername

# Corporate website
Project: Company Site
URL: https://yourcompany.com

# Landing page
Project: Landing Page Test
URL: https://your-landing-page.com
```

### Test Error Scenarios

See how the system handles errors:

1. **Invalid URLs**:
   - Try: `http://definitely-not-a-real-website.com`
   - Observe error handling

2. **Private/Protected Sites**:
   - Try: `https://private-site-with-auth.com`
   - See authentication errors

3. **Slow Websites**:
   - Try: `https://very-slow-website.com`
   - Watch timeout handling

## 📈 Performance Testing

Test system performance:

```bash
# Backend performance
cd backend
npm run test:performance

# Load testing (optional)
npm run test:load

# Database performance
npm run db:monitor
```

## 🔍 Troubleshooting Quick Start

### Common Issues

**Analysis Not Starting**:

```bash
# Check backend logs
docker-compose logs backend

# Verify database connection
curl http://localhost:4000/health/database

# Check queue system
curl http://localhost:4000/health/queue
```

**Frontend Not Loading**:

```bash
# Check frontend logs
docker-compose logs frontend

# Verify backend connection
curl http://localhost:4000/health

# Check environment variables
echo $NEXT_PUBLIC_BACKEND_URL
```

**WebSocket Issues**:

```bash
# Test WebSocket connection
curl -i -N -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  -H "Sec-WebSocket-Key: test" \
  -H "Sec-WebSocket-Version: 13" \
  http://localhost:4000/socket.io/
```

### Debug Mode

Enable debug logging:

```bash
# Backend debug mode
DEBUG=* npm run dev

# Frontend debug mode  
NODE_ENV=development npm run dev
```

## ✅ Success Checklist

After completing the quick start, you should have:

- ✅ Working Rival Outranker installation
- ✅ User account created and verified
- ✅ First project created successfully
- ✅ SEO analysis completed with results
- ✅ Understanding of the dashboard interface
- ✅ Familiarity with the scoring system
- ✅ Experience with real-time updates
- ✅ Basic API testing completed

## 🎯 Next Steps

Now that you're familiar with the basics:

1. **[User Guide](../user-guide/dashboard.md)** - Deep dive into features
2. **[API Documentation](../api/overview.md)** - Explore the API
3. **[Development Guide](../development/setup.md)** - Start customizing
4. **[Architecture Overview](../architecture/overview.md)** - Understand the system

## 💡 Pro Tips

**Efficiency Tips**:

- Use keyboard shortcuts in the dashboard
- Bookmark frequently used API endpoints
- Set up multiple test projects for different scenarios
- Use the browser dev tools to explore WebSocket events

**Analysis Tips**:

- Start with smaller websites for faster results
- Compare before/after scores when making improvements
- Focus on critical issues first for maximum impact
- Use the export feature to share reports

**Development Tips**:

- Keep both frontend and backend logs open
- Use the API documentation for testing
- Explore the database schema in Prisma Studio
- Test on mobile devices regularly

---

*Congratulations! You've completed the Rival Outranker quick start. 🎉*

**Need help?** Check our [troubleshooting guide](../operations/troubleshooting.md) or [create an issue](../../issues/new).
