# Coding Conventions

**Analysis Date:** 2026-06-09

## Naming Patterns

**Files:**
- React component files use kebab-case: `copy-button.tsx`, `settings-page.tsx`, `setup-page.tsx`
- UI primitive files use kebab-case: `src/components/ui/badge.tsx`, `src/components/ui/button.tsx`, `src/components/ui/field.tsx`
- Utility files use kebab-case: `src/lib/utils.ts`
- Entry point is `src/index.ts`

**Functions and Components:**
- React components use PascalCase named exports: `DrupalAssistantSettingsPage`, `CopyButton`, `Button`, `Field`, `FieldGroup`, `FieldLabel`
- Utility functions use camelCase: `cn`, `slugify`, `formatCurrencyMillions`, `firstName`, `compareValues`, `getPageNumbers`
- Server actions use camelCase with `Action` suffix: `generateCredentialsAction`

**Variables:**
- camelCase for all local variables and props

**Types:**
- Inline prop types via `React.ComponentProps<"element">` intersection pattern
- Named types use PascalCase: `ConnectorSetupPageProps`
- `type` keyword preferred over `interface` (observed in `setup-page.tsx`)

## Code Style

**Formatting:**
- No Prettier config detected at the repo root. Formatting appears consistent with 2-space indentation in TSX/TS files.
- `tsconfig.json` enforces `strict: true` and `forceConsistentCasingInFileNames: true`

**Linting:**
- No ESLint or Biome config detected. Linting is presumed to be delegated to the consuming monorepo.

**TypeScript:**
- Target: `ES2023`, module: `ESNext`, moduleResolution: `bundler`
- `noImplicitAny: false` (strict mode is on but `any` is not banned)
- `isolatedModules: true` — every file must be a module; no global augmentations
- `verbatimModuleSyntax: true` — use `import type` for type-only imports
- `jsx: react-jsx` — no React import needed in TSX files

## Import Organization

**Order observed:**
1. Third-party imports (`"server-only"`, `next/*`, `react`)
2. Internal UI component imports (`"./components/ui/..."`)
3. Peer SDK imports (`"@cinatra-ai/sdk-ui/..."`, `"@cinatra-ai/sdk-extensions"`)
4. Local lib/utility imports (`"./lib/..."`, `"@/lib/..."`)

**Path Aliases:**
- `@/` alias used in `settings-page.tsx` for app-level imports (e.g., `@/lib/drupal-widget-auth`). These resolve in the consuming monorepo, not in this repo standalone.
- Relative imports (`../../lib/utils`) used within the `src/components/ui/` subtree.

## React Directives

- `"use server"` applied at function level for Next.js server actions (inside `settings-page.tsx`)
- `"use client"` applied at file level for client components (`copy-button.tsx`, `src/components/ui/field.tsx`)
- `"server-only"` import guards server-only files (`settings-page.tsx`)
- `export const dynamic = "force-dynamic"` on the settings page to prevent static rendering

## Component Design

**UI Primitives (`src/components/ui/`):**
- Built with `class-variance-authority` (CVA) for variant management
- Accept a `className` prop merged via the `cn()` utility (`clsx` + `tailwind-merge`)
- Spread `...props` to the underlying DOM element for full HTML attribute pass-through
- Use `data-slot` attributes on root elements for CSS targeting: `data-slot="button"`, `data-slot="field"`, etc.
- Use `radix-ui`'s `Slot.Root` for `asChild` composition in `Button`

**Exports:**
- Named exports only — no default exports from UI primitives or library files
- `src/index.ts` re-exports top-level public API: only `DrupalAssistantSettingsPage`
- `setup-page.tsx` uses a default export (required by Next.js page convention)

## Error Handling

**Patterns:**
- Server actions wrap risky operations in `try/catch` and log via `console.error` with a `[drupal-widget]` prefix, then rethrow a user-friendly `Error`: see `generateCredentialsAction` in `settings-page.tsx`
- Utility functions use early returns with safe fallbacks: `null`, `undefined`, or `"Undisclosed"` for missing/invalid values (see `src/lib/utils.ts`)
- No custom error classes detected

## Logging

**Framework:** `console.error` only (no structured logging library)

**Patterns:**
- Error logs use a bracketed namespace prefix: `[drupal-widget]` followed by the action name and the caught error object

## Comments

**When to Comment:**
- Module-level comments describe routing context and mount points (`src/index.ts`, `setup-page.tsx`)
- Inline comments explain non-obvious variant choices (see `button.tsx` variant comments)
- `tsconfig.json` uses a `"//"` key for a top-level description comment

**JSDoc/TSDoc:**
- Not used. No JSDoc annotations detected.

## Package Shape Constraints

- This repo is a **source mirror** (Cinatra connector kind). It declares host-internal `@cinatra-ai/*` packages as optional peerDependencies — never in `dependencies` or `devDependencies`.
- `peerDependenciesMeta.optional: true` is required for all `@cinatra-ai/*` peers or CI fails (`ci.yml` enforces this).
- No lockfile is committed; the monorepo resolves dependencies.

---

*Convention analysis: 2026-06-09*
