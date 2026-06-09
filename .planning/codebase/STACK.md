# Technology Stack

**Analysis Date:** 2026-06-09

## Languages

**Primary:**
- TypeScript (ES2023 target) - All source files in `src/`
- TSX - React components in `src/components/ui/` and page components

**Secondary:**
- Not applicable

## Runtime

**Environment:**
- Node.js 24 (set in `.github/workflows/ci.yml` via `actions/setup-node`)
- ESM-only package (`"type": "module"` in `package.json`)

**Package Manager:**
- pnpm (via Corepack) — `corepack pnpm install` used in CI
- Lockfile: Not committed (CI uses `--no-frozen-lockfile` for standalone repos)

## Frameworks

**Core:**
- React 19.x (peer dependency) - UI component rendering, `"react": "^19.2.3"`
- Next.js - Server components used (`import "server-only"`, `revalidatePath` from `next/cache`, `Metadata` type from `next`)

**Testing:**
- Vitest - Test runner, configured via `"test": "vitest"` in `package.json`

**Build/Dev:**
- TypeScript compiler (`tsc`) - Standalone tsconfig at `tsconfig.json`
- Output: `dist/` directory, with declarations, declaration maps, and source maps enabled

## Key Dependencies

**Critical:**
- `class-variance-authority` ^0.7.1 - Variant-based className utilities for UI components
- `clsx` ^2.1.1 - Conditional className merging
- `tailwind-merge` ^3.5.0 - Tailwind class conflict resolution
- `radix-ui` ^1.4.3 - Accessible headless UI primitives

**Internal (optional peerDependencies — provided by cinatra monorepo):**
- `@cinatra-ai/sdk-extensions` - Provides `requireExtensionAction` for permission checks
- `@cinatra-ai/sdk-ui` - Provides marketplace layout components (`Main`, `PageHeader`, `PageContent`)

**Infrastructure:**
- `react-dom` ^19.2.3 (peer dependency) - DOM rendering

## Configuration

**Environment:**
- `NEXT_PUBLIC_APP_URL` - Cinatra application URL shown to users (optional, falls back to `BETTER_AUTH_URL`)
- `BETTER_AUTH_URL` - Fallback for the Cinatra URL; falls back to `http://localhost:3000`
- `DRUPAL_CONTENT_EDITOR_A2A_URL` - Agent-to-agent URL for Drupal content editor inside Docker (e.g., `http://wayflow-drupal-content-editor:3020`)
- `.env` files noted but not read

**Build:**
- `tsconfig.json` - Standalone TypeScript config (not extending monorepo config), targets `src/`, emits to `dist/`
- `"moduleResolution": "bundler"` with `"module": "ESNext"`

## Platform Requirements

**Development:**
- Node.js 24+, pnpm via Corepack
- Must be consumed from within the cinatra monorepo workspace (first-party `@cinatra-ai/*` peers are not published to any registry)

**Production:**
- Deployed as a Cinatra Marketplace connector extension
- Published via `cinatra-ai/.github` reusable release workflow to `registry.cinatra.ai` on GitHub Release tags
- Package name: `@cinatra-ai/drupal-assistant-connector` v0.1.0

---

*Stack analysis: 2026-06-09*
