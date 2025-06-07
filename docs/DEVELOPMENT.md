# SEO Director - Development Guidelines

## Code Quality Requirements

### Pre-Commit Validation
```bash
npm run lint          # Frontend linting
npm run typecheck     # TypeScript validation
cd backend && npm run lint      # Backend linting  
cd backend && npm run typecheck # Backend TypeScript
```

### Component Patterns
```tsx
// Primary Button
className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"

// Card Container
className="rounded-2xl border border-gray-700 bg-gray-800/50 backdrop-blur-sm"

// Feature Icon
className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-500/10"
```

### Typography & Spacing
- **Primary Font**: Inter (sans-serif)
- **Monospace Font**: JetBrains Mono (code elements)
- **Touch Targets**: Minimum 44px for mobile interfaces
- **Safe Areas**: Use iOS safe area insets for mobile

## Component Architecture

### Naming Conventions
- Use PascalCase for component files: `AnalysisDashboard.tsx`
- Use kebab-case for utility files: `api-response.ts`
- Prefix interfaces with capital I: `IAnalysisData`
- Use descriptive, specific names: `EnhancedAnalysisDashboard` not `Dashboard`

### File Organization
```
components/
├── ui/              # Base UI primitives (buttons, inputs)
├── analysis/        # SEO analysis specific components
├── dashboard/       # Dashboard specific components
├── forms/           # Form components
├── navigation/      # Navigation components
└── animations/      # Animation utilities
```

### Import Patterns
```tsx
// External dependencies first
import React from 'react';
import { useRouter } from 'next/navigation';

// Internal utilities
import { cn } from '@/lib/utils';

// Components (grouped by type)
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AnalysisHeader } from '@/components/analysis/analysis-header';

// Local imports last
import { AnalysisData } from './types';
```

## Development Workflow

### Branch Strategy
- `main` - Production-ready code
- `develop` - Integration branch
- `feature/feature-name` - Feature development
- `fix/issue-description` - Bug fixes

### Testing Strategy
- **Unit Tests**: Component logic and utilities
- **Integration Tests**: API endpoints and database operations
- **E2E Tests**: Critical user journeys
- **Visual Regression**: Component appearance validation

### Error Handling
```tsx
// Use React Error Boundaries
<ErrorBoundary fallback={<ErrorFallback />}>
  <AnalysisComponent />
</ErrorBoundary>

// Graceful API error handling
try {
  const data = await apiCall();
  return { success: true, data };
} catch (error) {
  console.error('API Error:', error);
  return { success: false, error: error.message };
}
```

## Performance Guidelines

### Code Splitting
```tsx
// Lazy load heavy components
const AnalysisDashboard = lazy(() => import('./AnalysisDashboard'));

// Use dynamic imports for conditionally loaded code
const loadAnalysisModule = () => import('./analysis-module');
```

### State Management
- Use React Query for server state
- Use Zustand for client state
- Avoid prop drilling - use context for deeply nested data
- Memoize expensive calculations with useMemo

### Image Optimization
- Use Next.js Image component
- Specify width/height for layout stability
- Use appropriate image formats (WebP/AVIF)
- Implement lazy loading for below-fold images

## Accessibility Guidelines

### Semantic HTML
- Use proper heading hierarchy (h1 → h2 → h3)
- Use semantic elements: `<nav>`, `<main>`, `<section>`, `<article>`
- Provide meaningful alt text for images
- Use `<button>` for actions, `<a>` for navigation

### ARIA Labels
```tsx
// Descriptive labels for screen readers
<button aria-label="Start SEO analysis for this website">
  Analyze
</button>

// Live regions for dynamic content
<div aria-live="polite" aria-atomic="true">
  {analysisStatus}
</div>
```

### Keyboard Navigation
- Ensure all interactive elements are keyboard accessible
- Implement logical tab order
- Provide visible focus indicators
- Support common keyboard shortcuts

### Color Contrast
- Maintain WCAG AA contrast ratios (4.5:1 for normal text)
- Don't rely solely on color to convey information
- Test with color blindness simulators
- Provide alternative visual indicators