<!-- refreshed: 2026-06-09 -->
# Architecture

**Analysis Date:** 2026-06-09

## System Overview

```text
┌─────────────────────────────────────────────────────────────┐
│              Host App (Next.js / Cinatra Platform)          │
│  Route: /connectors/cinatra-ai/drupal-assistant-connector/  │
│  Mounted via: src/app/plugins-registry.tsx (host)           │
└──────────────────────────────┬──────────────────────────────┘
                               │ imports DrupalAssistantSettingsPage
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                  Connector Package Public API                │
│  `src/index.ts`  (single named export)                      │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│               Settings Page (React Server Component)         │
│  `src/settings-page.tsx`                                     │
│  • Enforces RBAC via requireExtensionAction (sdk-extensions) │
│  • Reads/generates Drupal widget auth config                 │
│  • Queries MCP instance statuses                             │
└──────┬────────────────────────────────────────┬─────────────┘
       │                                        │
       ▼                                        ▼
┌────────────────────┐             ┌────────────────────────────┐
│  Local UI Components│             │  Platform SDK Imports      │
│  `src/components/` │             │  @cinatra-ai/sdk-ui        │
│  `src/copy-button` │             │  @cinatra-ai/sdk-extensions│
│  `src/lib/utils`   │             │  (peer deps, host provides)│
└────────────────────┘             └────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│  Host App Libraries (resolved via @/ alias in host context) │
│  @/lib/drupal-widget-auth      (credential store)           │
│  @/lib/drupal-mcp-connection   (MCP instance status)        │
└─────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| Public API re-export | Single named export consumed by host plugin registry | `src/index.ts` |
| DrupalAssistantSettingsPage | Server component: auth gate, credential display/generation, MCP status | `src/settings-page.tsx` |
| DrupalAssistantConnectorSetupPage | Thin dispatch shim for dynamic catch-all connector router | `src/setup-page.tsx` |
| CopyButton | Client component: clipboard copy with confirmation toggle | `src/copy-button.tsx` |
| Button | CVA-based button with variant/size system | `src/components/ui/button.tsx` |
| Badge | CVA-based badge with status variants | `src/components/ui/badge.tsx` |
| Field / FieldGroup / FieldLabel | Form field layout primitives with orientation support | `src/components/ui/field.tsx` |
| Input | Styled text input | `src/components/ui/input.tsx` |
| Label | Base label element | `src/components/ui/label.tsx` |
| Separator | Horizontal rule primitive | `src/components/ui/separator.tsx` |
| cn / slugify / utils | Tailwind class merging and shared helpers | `src/lib/utils.ts` |

## Pattern Overview

**Overall:** Cinatra Connector Plugin — a self-contained React/Next.js package that exports a single settings-page Server Component, mounted by a host app's connector registry at a known route. The package uses a clear server/client boundary (`"use server"`, `"use client"` directives) and delegates auth, data access, and layout chrome to the host platform via peer dependencies.

**Key Characteristics:**
- Single public export from `src/index.ts`; everything else is internal
- Settings page is a Next.js React Server Component (`"server-only"` enforced)
- Server Actions (inline `"use server"` functions) handle mutations without a separate API layer
- Client components (`CopyButton`) are isolated at the leaf level; all state lives in the client component only
- Host app libraries (`@/lib/drupal-widget-auth`, `@/lib/drupal-mcp-connection`) are resolved at runtime via path alias — these files do NOT exist in this package; they live in the host Next.js app

## Layers

**Public API Layer:**
- Purpose: Exposes connector surface to host plugin registry
- Location: `src/index.ts`
- Contains: Named re-exports only
- Depends on: `src/settings-page.tsx`
- Used by: Host app `src/app/plugins-registry.tsx`

**Page / Routing Layer:**
- Purpose: Route dispatch shim for dynamic connector catch-all router
- Location: `src/setup-page.tsx`
- Contains: Default export React component matching ConnectorSetupPageProps interface
- Depends on: `src/settings-page.tsx`
- Used by: Host app dynamic connector route

**Settings Page (Server Component) Layer:**
- Purpose: Auth-gated page rendering credential management and MCP status
- Location: `src/settings-page.tsx`
- Contains: RSC with inline Server Actions, data fetching, layout composition
- Depends on: `@cinatra-ai/sdk-extensions` (RBAC), `@cinatra-ai/sdk-ui/marketplace` (layout chrome), host `@/lib/*` libraries, local UI components
- Used by: Public API layer and route dispatch layer

**UI Component Layer:**
- Purpose: Self-contained, styled primitive components
- Location: `src/components/ui/`
- Contains: CVA-based variants, Radix UI Slot for polymorphism, Tailwind styling
- Depends on: `src/lib/utils.ts` (cn), `radix-ui`, `class-variance-authority`
- Used by: Settings page, CopyButton

**Utility Layer:**
- Purpose: Shared helpers (class merging, string formatting)
- Location: `src/lib/utils.ts`
- Contains: `cn`, `slugify`, `formatCurrencyMillions`, `firstName`, `quarterLabel`, `asArray`, `compareValues`, `getPageNumbers`
- Depends on: `clsx`, `tailwind-merge`
- Used by: All UI components

## Data Flow

### Credential Read Path

1. Host app router resolves `/connectors/cinatra-ai/drupal-assistant-connector/setup` and invokes `DrupalAssistantSettingsPage` (`src/settings-page.tsx:34`)
2. `requireExtensionAction("@cinatra-ai/drupal-assistant-connector", "read")` enforces RBAC via `@cinatra-ai/sdk-extensions`
3. `readDrupalWidgetAuthConfig()` is called from host lib `@/lib/drupal-widget-auth` — returns existing config or null
4. `getDrupalMcpInstanceStatuses()` is called from host lib `@/lib/drupal-mcp-connection` — returns per-instance status array
5. Server component renders credentials form + MCP status list as HTML

### Credential Generation Path

1. User submits the "Generate credentials" form (`src/settings-page.tsx:59`)
2. Next.js invokes the inline `generateCredentialsAction` Server Action
3. `requireExtensionAction("@cinatra-ai/drupal-assistant-connector", "manage")` enforces elevated RBAC
4. `generateDrupalWidgetAuthConfig()` writes new credentials via host lib
5. `revalidatePath(...)` invalidates the page cache, triggering a re-render with new config

**State Management:**
- Server state (credentials, MCP status): fetched fresh on each request via host app libraries; no client-side global store
- Client state: `CopyButton` uses local `useState` for transient copy-confirmation UI only (`src/copy-button.tsx`)

## Key Abstractions

**Cinatra Connector Manifest:**
- Purpose: Declares this package as a Cinatra connector via the `cinatra` field in `package.json`
- Examples: `package.json` (`cinatra.kind = "connector"`, `cinatra.apiVersion = "cinatra.ai/v1"`)
- Pattern: Host app reads manifest metadata to register connector in its plugin registry

**requireExtensionAction:**
- Purpose: RBAC gate — throws if current user lacks the named permission on this connector
- Examples: `src/settings-page.tsx:35` (read), `src/settings-page.tsx:24` (manage)
- Pattern: Called at the top of every server function that accesses or mutates data

**CVA Component Pattern:**
- Purpose: Typed, composable variant system for UI primitives
- Examples: `src/components/ui/button.tsx`, `src/components/ui/badge.tsx`, `src/components/ui/field.tsx`
- Pattern: `cva(baseClasses, { variants: {...} })` → `buttonVariants({variant, size, className})` → passed to `cn()`

**Server/Client Boundary:**
- Purpose: Explicit directive separation to minimize client bundle
- Examples: `"use server"` in `src/settings-page.tsx`; `"use client"` in `src/copy-button.tsx` and `src/components/ui/field.tsx`
- Pattern: Only interactive leaf components (clipboard copy, form field animations) are client components

## Entry Points

**Package Export:**
- Location: `src/index.ts`
- Triggers: Host app imports `DrupalAssistantSettingsPage` from `@cinatra-ai/drupal-assistant-connector`
- Responsibilities: Re-exports the settings page component; nothing else

**Connector Route Shim:**
- Location: `src/setup-page.tsx`
- Triggers: Dynamic catch-all connector router in host app
- Responsibilities: Delegates to `DrupalAssistantSettingsPage`; exposes `ConnectorSetupPageProps` default export interface

## Architectural Constraints

- **Server-only enforcement:** `src/settings-page.tsx` imports `"server-only"` — Next.js will throw a build error if this module is accidentally imported into a client component tree
- **Host path alias dependency:** `@/lib/drupal-widget-auth` and `@/lib/drupal-mcp-connection` are NOT bundled in this package; they must exist in the consuming host app resolved via its `@/` alias
- **Peer dependencies:** `react`, `react-dom`, `@cinatra-ai/sdk-extensions`, `@cinatra-ai/sdk-ui` are peers — the host app provides these; mismatched versions will cause runtime issues
- **No standalone build:** `tsconfig.json` has `"noEmit": false` and targets `dist/`, but the package is consumed as source (`"main": "./src/index.ts"`) — the host bundler compiles it
- **Global state:** None detected within this package; all persistence is delegated to host app libraries
- **Circular imports:** None detected

## Anti-Patterns

### Utility Function Scope Creep

**What happens:** `src/lib/utils.ts` contains general-purpose helpers (`formatCurrencyMillions`, `getPageNumbers`, `quarterLabel`) that are unrelated to the Drupal connector domain
**Why it's wrong:** These utilities appear copied from a broader monorepo shared library into this isolated connector package, creating maintenance divergence and dead code
**Do this instead:** Keep only `cn` and `slugify` (actually used) in `src/lib/utils.ts`; remove unused helpers or move them to a shared package consumed as a dependency

## Error Handling

**Strategy:** Server Actions catch errors, log them, and re-throw as user-facing `Error` with a safe message. No structured error type system.

**Patterns:**
- `generateCredentialsAction` wraps host lib calls in try/catch, logs with `console.error`, and throws a generic user-visible message (`src/settings-page.tsx:22-32`)
- MCP status errors are handled by the host lib (`getDrupalMcpInstanceStatuses`) and surfaced as typed status strings (`auth_error`, `not_installed`, `unreachable`) rendered inline in the UI

## Cross-Cutting Concerns

**Logging:** `console.error` only, used in Server Actions on failure. No structured logger.
**Validation:** No input validation within this package; credential generation is triggered by form submit with RBAC gate only.
**Authentication:** Delegated entirely to `requireExtensionAction` from `@cinatra-ai/sdk-extensions`; this package has no auth logic of its own.

---

*Architecture analysis: 2026-06-09*
