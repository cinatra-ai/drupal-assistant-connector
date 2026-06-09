# Codebase Structure

**Analysis Date:** 2026-06-09

## Directory Layout

```
drupal-assistant-connector/
├── src/
│   ├── index.ts                  # Package public API — single named export
│   ├── settings-page.tsx         # Server Component: credential management UI
│   ├── setup-page.tsx            # Route dispatch shim for connector catch-all router
│   ├── copy-button.tsx           # Client component: clipboard copy with visual feedback
│   ├── components/
│   │   └── ui/
│   │       ├── badge.tsx         # Status badge primitive (CVA variants)
│   │       ├── button.tsx        # Button primitive (CVA variants + sizes)
│   │       ├── field.tsx         # Form field layout: Field, FieldGroup, FieldLabel, etc.
│   │       ├── input.tsx         # Styled text input
│   │       ├── label.tsx         # Base label element
│   │       └── separator.tsx     # Horizontal rule primitive
│   └── lib/
│       └── utils.ts              # cn(), slugify(), and misc shared helpers
├── .github/
│   └── workflows/
│       ├── ci.yml                # CI pipeline
│       └── release.yml           # Release automation
├── .npmrc                        # npm registry configuration
├── package.json                  # Package manifest + Cinatra connector metadata
├── tsconfig.json                 # Standalone TypeScript config (targets src/, outputs dist/)
├── LICENSE                       # Apache-2.0
└── README.md                     # Feature overview and capability list
```

## Directory Purposes

**`src/`:**
- Purpose: All package source code; compiled by the host app's bundler (not pre-built)
- Contains: RSC page components, client components, UI primitives, utilities
- Key files: `src/index.ts` (public API), `src/settings-page.tsx` (primary component)

**`src/components/ui/`:**
- Purpose: Self-contained styled primitives local to this connector
- Contains: CVA-based React components using Radix UI Slot and Tailwind CSS
- Key files: `button.tsx`, `badge.tsx`, `field.tsx`

**`src/lib/`:**
- Purpose: Internal utilities shared across connector components
- Contains: `cn()` (class merging), `slugify()`, and miscellaneous helpers
- Key files: `src/lib/utils.ts`

**`.github/workflows/`:**
- Purpose: GitHub Actions CI and release automation
- Contains: `ci.yml`, `release.yml`

## Key File Locations

**Entry Points:**
- `src/index.ts`: Package public export — exports `DrupalAssistantSettingsPage`
- `src/setup-page.tsx`: Default export consumed by dynamic connector router

**Configuration:**
- `package.json`: npm manifest; includes `cinatra` field declaring connector kind/apiVersion/displayName
- `tsconfig.json`: TypeScript config (strict, ESNext modules, `bundler` resolution, outputs to `dist/`)
- `.npmrc`: npm registry auth (existence noted; contents not read)

**Core Logic:**
- `src/settings-page.tsx`: Auth gate, credential read/generate, MCP status display
- `src/copy-button.tsx`: Only client-side interactive component in the package

**CI/CD:**
- `.github/workflows/ci.yml`: CI pipeline
- `.github/workflows/release.yml`: Release workflow

## Naming Conventions

**Files:**
- React components: kebab-case (e.g., `copy-button.tsx`, `settings-page.tsx`, `setup-page.tsx`)
- UI primitives: single noun, kebab-case (e.g., `badge.tsx`, `button.tsx`, `field.tsx`)
- Utilities: noun (e.g., `utils.ts`)

**Directories:**
- Lowercase, descriptive: `components/`, `ui/`, `lib/`

**Exports:**
- Named exports for all components (no default exports from UI primitives)
- Default export only in `src/setup-page.tsx` (required by host router interface)
- PascalCase component function names: `DrupalAssistantSettingsPage`, `Button`, `Badge`, `CopyButton`
- camelCase utility function names: `cn`, `slugify`, `formatCurrencyMillions`
- camelCase CVA variant objects: `buttonVariants`, `badgeVariants`, `fieldVariants`

## Where to Add New Code

**New UI section on the settings page:**
- Primary code: `src/settings-page.tsx` — add within the `<PageContent>` tree
- New primitives needed: `src/components/ui/`

**New UI primitive component:**
- Implementation: `src/components/ui/<component-name>.tsx`
- Pattern: Follow CVA + Radix UI Slot pattern from `src/components/ui/button.tsx`
- Export from the component file directly; no barrel file in `components/ui/`

**New client-interactive widget:**
- Implementation: `src/<widget-name>.tsx` (alongside `copy-button.tsx`)
- Add `"use client"` directive at top
- Keep state minimal and local to the component

**New utility function:**
- Location: `src/lib/utils.ts`
- Note: Only add utilities that are actually used within this package

**New Server Action (mutation):**
- Location: inline `async function` with `"use server"` directive inside `src/settings-page.tsx`
- Pattern: Gate with `requireExtensionAction(...)`, wrap in try/catch, call `revalidatePath` on success

## Special Directories

**`dist/`:**
- Purpose: TypeScript compilation output (declared in `tsconfig.json` as `outDir`)
- Generated: Yes
- Committed: No (not present in repo; host app compiles from source via `"main": "./src/index.ts"`)

**`.planning/codebase/`:**
- Purpose: GSD codebase analysis documents
- Generated: Yes (by gsd-map-codebase tooling)
- Committed: Per project convention

---

*Structure analysis: 2026-06-09*
