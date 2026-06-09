# External Integrations

**Analysis Date:** 2026-06-09

## APIs & External Services

**Drupal CMS (external):**
- Drupal sites - The connector generates bearer-token API keys consumed by the `drupal/cinatra` Drupal module
  - SDK/Client: None — credentials are generated locally and pasted by the user into Drupal's configuration form
  - Auth: Bearer token (API key minted by `generateDrupalWidgetAuthConfig`, stored in local config)

**Drupal MCP Tools:**
- `drupal/mcp_tools` Drupal module - Automatically registered as an MCP server per configured Drupal site
  - Status checked via `getDrupalMcpInstanceStatuses()` from `@/lib/drupal-mcp-connection`
  - Statuses: `registered`, `auth_error`, `not_installed`, or unreachable
  - Requires `drupal/mcp_tools` with `mcp_tools_remote` submodule enabled on the Drupal site

## Data Storage

**Databases:**
- Not applicable — this connector has no direct database access

**Credential/Config Storage:**
- Local auth config managed via `readDrupalWidgetAuthConfig()` and `generateDrupalWidgetAuthConfig()` from `@/lib/drupal-widget-auth` (host monorepo library)
  - Stores: generated API key and `generatedAt` timestamp
  - Client: Internal cinatra monorepo library (not directly in this repo)

**File Storage:**
- Not applicable

**Caching:**
- Next.js path revalidation via `revalidatePath("/connectors/cinatra-ai/drupal-assistant-connector/setup")` called after credential generation

## Authentication & Identity

**Auth Provider:**
- `@cinatra-ai/sdk-extensions` - Provides `requireExtensionAction(packageId, action)` for permission enforcement
  - Called with `"@cinatra-ai/drupal-assistant-connector"` and `"read"` or `"manage"` scopes
  - Used in `src/settings-page.tsx` before any credential read or write operation

**Drupal Auth:**
- Bearer token scheme: Drupal widget sends `Authorization: Bearer <api-key>` on every request
  - Key generated on demand, regeneration immediately invalidates previous key

## Monitoring & Observability

**Error Tracking:**
- Not detected (no third-party error tracking SDK)

**Logs:**
- `console.error` used in `generateCredentialsAction` failure path (`src/settings-page.tsx`)

## CI/CD & Deployment

**Hosting:**
- Cinatra Marketplace (`registry.cinatra.ai`)
- Extension kind: `connector` (per `package.json` `cinatra.kind`)

**CI Pipeline:**
- GitHub Actions — `.github/workflows/ci.yml`
  - Runs on push/PR to `main`
  - Classifies repo as "source mirror" (has first-party optional peers) — install/typecheck/test are skipped standalone; cinatra monorepo handles those
  - Validates first-party dep shape: `@cinatra-ai/*` must only appear as optional peerDependencies
  - Runs `npm pack --dry-run` for package shape validation

**Release Pipeline:**
- GitHub Actions — `.github/workflows/release.yml`
  - Triggers on GitHub Release published or `workflow_dispatch` against a version tag
  - Delegates to `cinatra-ai/.github/.github/workflows/reusable-extension-release.yml@main`
  - Requires `CINATRA_MARKETPLACE_VENDOR_TOKEN` org secret
  - Grants `id-token: write` for build provenance attestation

## Environment Configuration

**Required env vars (at runtime in monorepo host):**
- `NEXT_PUBLIC_APP_URL` or `BETTER_AUTH_URL` — Cinatra URL surfaced to the user for pasting into Drupal config
- `DRUPAL_CONTENT_EDITOR_A2A_URL` — Agent-to-agent URL for Docker deployments of the Drupal content editor service

**Secrets location:**
- `.env` / `.env.local` files in the host monorepo (not present in this repo)
- `.npmrc` present — notes existence only, not read

## Webhooks & Callbacks

**Incoming:**
- Not applicable — this connector has no webhook endpoints of its own

**Outgoing:**
- MCP server registration: Cinatra automatically registers `drupal/mcp_tools` endpoints on configured Drupal sites (connection logic in `@/lib/drupal-mcp-connection` in host monorepo)

---

*Integration audit: 2026-06-09*
