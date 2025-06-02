# Claude Code Memory

## Commit Message Guidelines

**DO NOT include the following messages in any git commits:**
- "🤖 Generated with [Claude Code](https://claude.ai/code)"
- "Co-Authored-By: Claude <noreply@anthropic.com>"

Keep commit messages clean and professional without automated generation signatures.

## Build Commands

Run these commands to verify code quality before committing:
- `npm run lint` - Lint frontend code
- `npm run typecheck` - TypeScript type checking
- `cd backend && npm run lint` - Lint backend code (if available)
- `cd backend && npm run typecheck` - Backend TypeScript checking (if available)

## Project Structure Notes

- This is a Next.js frontend with a Node.js/Express backend
- Backend uses Prisma for database operations
- TypeScript strict mode is enabled - always add explicit types
- Netlify deployment requires clean TypeScript compilation

## Brand Guidelines

### Color Palette

#### Primary Brand Colors
- **Indigo**: Primary brand color
  - `indigo-400` - Light accent (#818cf8)
  - `indigo-500` - Main brand (#6366f1)
  - `indigo-600` - CTA buttons (#4f46e5)
  - `indigo-700` - Hover states (#4338ca)

- **Purple**: Secondary brand color
  - `purple-400` - Light accent (#a78bfa)
  - `purple-500` - Secondary (#8b5cf6)
  - `purple-600` - Gradients (#7c3aed)

- **Pink**: Accent color
  - `pink-400` - Gradient accents (#f472b6)
  - `pink-500` - Decorative (#ec4899)

#### Background Colors
- Primary background: `#0F172A` (dark navy)
- Secondary sections: `#1A202C`
- Card backgrounds: `#2D3748`
- Hover states: `#3A4556`

#### Semantic Colors
- Success/Good: `green-400` (#4ade80) or `#10b981`
- Warning/Needs Work: `amber-400` (#fbbf24) or `#f59e0b`
- Error/Critical: `rose-400` (#fb7185) or `#ef4444`
- Info: `blue-400` (#60a5fa) or `#0ea5e9`

#### Text Colors
- Primary text: `white` on dark backgrounds
- Secondary text: `gray-300` or `gray-400`
- Muted text: `gray-500` or `gray-600`

### Typography

#### Font Families
- Primary: Inter (sans-serif)
- Monospace: JetBrains Mono (for code)

#### Heading Styles
```tsx
// H1 - Hero/Page titles
className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight"

// H2 - Section headings
className="text-3xl sm:text-4xl font-bold tracking-tight"

// H3 - Subsection headings
className="text-xl font-bold"
```

#### Text Effects
- Gradient text: `bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent`
- Body text: `text-lg text-gray-300`
- Small/muted: `text-sm text-gray-400`

### Component Patterns

#### Primary Button
```tsx
className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-0 h-14 text-base px-8"
```

#### Secondary/Outline Button
```tsx
className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white bg-transparent"
```

#### Cards
```tsx
className="rounded-2xl border border-gray-700 bg-gray-800/50 backdrop-blur-sm p-6 hover:border-gray-600"
```

#### Feature Icon Container
```tsx
className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-700/50 backdrop-blur-sm"
```

### Gradient Patterns

#### Background Gradients
- Hero sections: `from-[#0F172A] via-[#1A202C] to-[#0F172A]`
- CTA sections: `from-indigo-600 to-purple-700`
- Decorative blobs: `from-indigo-500/30 to-purple-500/30 blur-3xl`

#### Button/CTA Gradients
- Primary: `from-indigo-600 to-purple-600`
- Hover: `from-indigo-700 to-purple-700`

#### Text Gradients
- Primary: `from-indigo-400 to-purple-400`
- Extended: `from-indigo-400 via-purple-400 to-pink-400`

### Animation Guidelines

#### Framer Motion Presets
```tsx
// Fade in up animation
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1.0] }
  }
};

// Stagger container
const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 }
  }
};
```

#### Hover Effects
- Cards: `whileHover={{ y: -5 }}`
- Buttons: Arrow slide `group-hover:translate-x-1`
- Scale: `hover:scale-105`

### Spacing & Layout

#### Container Widths
- Content max width: `max-w-7xl mx-auto`
- Narrow content: `max-w-4xl mx-auto`
- Section padding: `py-24` or `py-16`

#### Common Grids
- Features: `grid gap-8 md:grid-cols-2 lg:grid-cols-3`
- Stats: `grid grid-cols-2 gap-8 md:grid-cols-4`

### Visual Effects

#### Borders
- Default: `border-gray-700`
- Hover: `hover:border-gray-600`
- Rounded: `rounded-2xl`, `rounded-xl`, `rounded-lg`

#### Glass Morphism
```tsx
className="bg-gray-800/50 backdrop-blur-sm"
```

#### Badges/Pills
```tsx
className="inline-flex items-center rounded-full bg-indigo-500/10 border border-indigo-500/20 px-4 py-1.5 text-sm font-medium text-indigo-400"
```

### Usage Examples

#### Hero Section Pattern
```tsx
<section className="relative overflow-hidden bg-gradient-to-b from-[#0F172A] via-[#1A202C] to-[#0F172A] py-24">
  <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
    <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
      Your Title Here
    </span>
  </h1>
</section>
```

#### Feature Card Pattern
```tsx
<div className="group relative rounded-2xl border border-gray-700 bg-gray-800/50 p-8 backdrop-blur-sm transition-all hover:border-gray-600">
  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-500/10">
    <Icon className="h-6 w-6 text-indigo-400" />
  </div>
  <h3 className="mb-2 text-xl font-bold text-white">Feature Title</h3>
  <p className="text-gray-300">Feature description</p>
</div>
```