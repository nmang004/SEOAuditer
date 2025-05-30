# URL Hierarchy Documentation - Rival Outranker SEO Analysis Platform

## Overview
This document outlines the restructured URL hierarchy for the Rival Outranker SEO analysis web application, designed to provide logical, intuitive, and user-friendly navigation.

## URL Structure Summary

### 🌍 Public Routes (No Authentication Required)
```
/                           # Landing/marketing page
/login                      # User login
/register                   # User registration
/forgot-password           # Password reset
/pricing                   # Pricing plans
/about                     # About page
/help                      # Help documentation
/privacy                   # Privacy policy
/terms                     # Terms of service
```

### 🔐 Authenticated App Routes

#### Dashboard & Main Navigation
```
/dashboard                 # Main dashboard overview
├── /dashboard/projects    # Projects list/management
├── /dashboard/settings    # User settings and preferences
└── /dashboard/billing     # Billing and subscription (future)
```

#### Project Management
```
/projects                              # Projects overview (redirects to /dashboard/projects)
/projects/new                          # Create new project
/projects/[projectId]                  # Individual project overview
├── /projects/[projectId]/settings     # Project settings
├── /projects/[projectId]/analyses     # Project analyses list
└── /projects/[projectId]/issues       # Project-specific issues
```

#### Analysis Management (Core Feature)
```
/analyses                                    # All analyses overview
/analyses/new                                # Start new analysis (with project selection)
/analyses/[analysisId]                       # Redirects to overview tab
├── /analyses/[analysisId]/overview          # Analysis overview (default tab)
├── /analyses/[analysisId]/technical         # Technical SEO details
├── /analyses/[analysisId]/content           # Content analysis details
├── /analyses/[analysisId]/onpage           # On-page SEO details
├── /analyses/[analysisId]/performance      # Performance metrics
├── /analyses/[analysisId]/issues           # Issues list and management
├── /analyses/[analysisId]/recommendations  # Recommendations list
├── /analyses/[analysisId]/history          # Historical comparison
└── /analyses/[analysisId]/export           # Export options
```

#### Contextual Analysis Routes (Within Project Context)
```
/projects/[projectId]/analyses/[analysisId]                    # Analysis within project context
├── /projects/[projectId]/analyses/[analysisId]/overview       # Redirects to overview
├── /projects/[projectId]/analyses/[analysisId]/technical      # Technical tab
├── /projects/[projectId]/analyses/[analysisId]/content        # Content tab
├── /projects/[projectId]/analyses/[analysisId]/onpage         # On-page tab
├── /projects/[projectId]/analyses/[analysisId]/performance    # Performance tab
├── /projects/[projectId]/analyses/[analysisId]/issues         # Issues tab
├── /projects/[projectId]/analyses/[analysisId]/recommendations # Recommendations tab
├── /projects/[projectId]/analyses/[analysisId]/history        # History tab
└── /projects/[projectId]/analyses/[analysisId]/export         # Export tab
```

#### Issues Management
```
/issues                               # Global issues across all projects
├── /issues/critical                  # Critical issues only
├── /issues/resolved                  # Resolved issues
└── /issues/[issueId]                # Individual issue details
```

#### Search & Discovery
```
/search                               # Global search across projects/analyses
/search?q=[query]                     # Search with query parameter
/search?type=projects                 # Search filtered by type
/search?type=analyses
/search?type=issues
```

## Route Groups Implementation

### App Router Structure
```typescript
app/
├── (auth)/                           # Route group for auth pages
│   ├── login/page.tsx
│   ├── register/page.tsx
│   ├── forgot-password/page.tsx
│   └── layout.tsx                    # Auth-specific layout
├── (marketing)/                      # Route group for public pages
│   ├── pricing/page.tsx
│   ├── about/page.tsx
│   └── help/page.tsx
├── (app)/                           # Route group for authenticated app
│   ├── layout.tsx                   # App layout with navigation
│   ├── dashboard/
│   │   ├── page.tsx                 # Dashboard overview
│   │   ├── projects/page.tsx
│   │   └── settings/page.tsx
│   ├── projects/
│   │   ├── page.tsx                 # Projects list
│   │   ├── new/page.tsx
│   │   └── [projectId]/
│   │       ├── page.tsx             # Project overview
│   │       ├── settings/page.tsx
│   │       ├── analyses/
│   │       │   ├── page.tsx
│   │       │   └── [analysisId]/
│   │       │       ├── page.tsx     # Redirect to overview
│   │       │       ├── layout.tsx   # Analysis layout with tabs
│   │       │       ├── overview/page.tsx
│   │       │       ├── technical/page.tsx
│   │       │       ├── content/page.tsx
│   │       │       ├── onpage/page.tsx
│   │       │       ├── performance/page.tsx
│   │       │       ├── issues/page.tsx
│   │       │       ├── recommendations/page.tsx
│   │       │       ├── history/page.tsx
│   │       │       └── export/page.tsx
│   │       └── issues/page.tsx
│   ├── analyses/
│   │   ├── page.tsx                 # All analyses
│   │   ├── new/page.tsx
│   │   └── [analysisId]/
│   │       ├── page.tsx             # Redirect to overview
│   │       ├── layout.tsx           # Analysis layout with tabs
│   │       ├── overview/page.tsx
│   │       ├── technical/page.tsx
│   │       ├── content/page.tsx
│   │       ├── onpage/page.tsx
│   │       ├── performance/page.tsx
│   │       ├── issues/page.tsx
│   │       ├── recommendations/page.tsx
│   │       ├── history/page.tsx
│   │       └── export/page.tsx
│   ├── issues/
│   │   ├── page.tsx                 # Global issues
│   │   ├── critical/page.tsx
│   │   ├── resolved/page.tsx
│   │   └── [issueId]/page.tsx
│   └── search/page.tsx
├── page.tsx                         # Landing page
├── globals.css
└── layout.tsx                       # Root layout
```

## Navigation Features

### Enhanced Breadcrumb System
- **Context-aware**: Shows relevant navigation path based on current location
- **Dynamic content**: Fetches project/analysis names for meaningful labels
- **Interactive**: All breadcrumb items are clickable links
- **Responsive**: Adapts to different contexts (global vs project-specific)

### Intelligent Redirects
- **Legacy URL support**: Old URLs automatically redirect to new structure
- **Auto-navigation**: Bare analysis URLs redirect to overview tab
- **Context preservation**: Maintains project context when navigating

### Smart URL Generation
```typescript
// Helper functions for consistent URL generation
urlHelpers.analysis(analysisId, tab?, projectId?) 
// Returns: /analyses/123/overview or /projects/456/analyses/123/technical

urlHelpers.issue(issueId, context?)
// Returns: /issues/789 or /analyses/123/issues/789

urlHelpers.project(projectId, section?)
// Returns: /projects/456 or /projects/456/settings
```

## Authentication & Protection

### Middleware Configuration
- **Route protection**: Automatic redirect to login for protected routes
- **Auth state management**: Prevents authenticated users from accessing auth pages
- **Return URL handling**: Preserves intended destination after login

### Protected Route Groups
```typescript
const protectedRoutes = [
  '/dashboard',
  '/projects', 
  '/analyses',
  '/issues',
  '/search'
];
```

## SEO & Meta Tags

### Dynamic Meta Generation
```typescript
// Example meta tag generation based on URL structure
/dashboard → "Dashboard - SEO Analyzer"
/projects/[id] → "{ProjectName} - Project Overview"
/analyses/[id]/overview → "Analysis Results - {ProjectName}"
/issues → "SEO Issues - SEO Analyzer"
```

## URL Parameters & Filters

### Supported Parameters
```typescript
interface URLParams {
  // Core navigation
  projectId?: string;
  analysisId?: string;
  tab?: string;
  
  // Filtering
  filter?: string;
  sort?: string;
  page?: number;
  limit?: number;
  
  // Search
  q?: string;
  type?: 'projects' | 'analyses' | 'issues';
  
  // Date ranges
  from?: string;
  to?: string;
}
```

### Filter Examples
```
/dashboard?filter=recent              # Dashboard with recent filter
/issues?severity=critical             # Critical issues only
/search?q=meta&type=issues           # Search for "meta" in issues
/analyses?status=completed&sort=date  # Completed analyses sorted by date
```

## Mobile Considerations

### Responsive Navigation
- **Collapsible sidebar**: Mobile-friendly navigation drawer
- **Touch-optimized**: Appropriate touch targets and gestures
- **Context preservation**: Maintains navigation state across screen sizes

### URL Structure Benefits
- **Bookmarkable**: All states are URL-addressable
- **Shareable**: Direct links to specific analysis results
- **Deep linking**: Support for direct navigation to any app state

## Implementation Benefits

### User Experience
- **Intuitive hierarchy**: Logical URL structure matches mental model
- **Consistent patterns**: Predictable URL patterns across features
- **Fast navigation**: Clear paths between related content

### Developer Experience
- **Type safety**: TypeScript interfaces for all URL parameters
- **Reusable helpers**: Utility functions for URL generation
- **Maintainable**: Clear separation of concerns with route groups

### SEO Benefits
- **Semantic URLs**: Meaningful paths for search engines
- **Proper redirects**: 301 redirects for moved content
- **Structured data**: Clear hierarchy for better indexing

## Migration Path

### Legacy URL Handling
```typescript
// Automatic redirects handle old URL patterns
/analysis → /analyses
/dashboard/analysis/[id] → /analyses/[id]
/analysis/results/[id] → /analyses/[id]/overview
```

### Gradual Rollout
1. **Phase 1**: Implement new structure alongside old
2. **Phase 2**: Add redirects from old to new URLs
3. **Phase 3**: Update all internal links
4. **Phase 4**: Remove old route handlers

This URL hierarchy provides a solid foundation for scaling the SEO analysis platform while maintaining excellent user experience and developer productivity. 