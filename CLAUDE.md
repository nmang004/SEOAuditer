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