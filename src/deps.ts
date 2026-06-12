// Host DI singleton for the Drupal Assistant connector's runtime deps.
//
// The connector carries NO non-SDK `@cinatra-ai/*` code dependency and NO `@/`
// host-internal import (cinatra#172 Stage H2): every host-shared surface it
// needs is delivered here, bound at activation by `register(ctx)` adapting the
// per-concern host services published in the capability registry
// (`@cinatra-ai/host:drupal-widget-auth`, `@cinatra-ai/host:drupal-mcp`).
// Surfaces:
//   - widget auth-config — read + generate of the Drupal module credentials
//                          (`@/lib/drupal-widget-auth` stays host-side).
//                          `generateWidgetAuthConfig` is a WRITER (mints and
//                          persists a fresh API key, invalidating the old) and
//                          is only ever called behind the settings page's
//                          manage-gated "use server" action.
//   - MCP instance statuses — per-instance reachability of the drupal/mcp_tools
//                          endpoints (`@/lib/drupal-mcp-connection` stays
//                          host-side; probe + Nango bearer run host-side).
//
// The deps slot is anchored on `globalThis` via a namespaced+versioned Symbol
// so the boot-time registration and the runtime callers — which live in
// SEPARATELY-COMPILED Next.js bundles (the settings page and its "use server"
// action do NOT import the registrar) — resolve the SAME slot. A plain
// module-local binding would leave those bundles' instance unregistered →
// getDrupalAssistantDeps() would throw. (Same reason as the SDK action-guard +
// the drupal-mcp/apollo/gemini/email-connector deps slots.)

/** Widget auth config row (structural mirror of the host's
 * `DrupalWidgetAuthConfig` — no SDK/type import needed to compile against any
 * host this connector can meet during skew). */
export type DrupalWidgetAuthConfig = {
  apiKey: string;
  generatedAt: string;
};

/** Per-instance MCP reachability status (structural mirror of the host's
 * `DrupalMcpInstanceStatus`). */
export type DrupalAssistantMcpInstanceStatus = {
  id: string;
  name: string;
  siteUrl: string;
  status: "registered" | "not_installed" | "auth_error" | "unreachable";
  isPrivate: boolean;
};

export interface DrupalAssistantConnectorDeps {
  /** Read the stored widget auth config (null when never generated). */
  readWidgetAuthConfig: () => DrupalWidgetAuthConfig | null;
  /** WRITER — mint + persist a fresh widget API key (invalidates the old).
   * Only ever called behind the settings page's manage-gated "use server"
   * action — the same `requireExtensionAction` posture as the static import
   * it replaces. */
  generateWidgetAuthConfig: () => DrupalWidgetAuthConfig;
  /** Per-instance MCP reachability statuses (host probe + Nango bearer). */
  listMcpInstanceStatuses: () => Promise<DrupalAssistantMcpInstanceStatus[]>;
}

const DRUPAL_ASSISTANT_DEPS_KEY = Symbol.for(
  "@cinatra-ai/drupal-assistant-connector:host-deps/v1",
);
type DepsHolder = { [k: symbol]: DrupalAssistantConnectorDeps | null | undefined };
const _holder = globalThis as unknown as DepsHolder;

export function registerDrupalAssistantConnector(deps: DrupalAssistantConnectorDeps): void {
  _holder[DRUPAL_ASSISTANT_DEPS_KEY] = deps;
}

export function getDrupalAssistantDeps(): DrupalAssistantConnectorDeps {
  const deps = _holder[DRUPAL_ASSISTANT_DEPS_KEY];
  if (!deps) {
    throw new Error(
      "@cinatra-ai/drupal-assistant-connector: host runtime deps not registered. " +
        "Call registerDrupalAssistantConnector(deps) at boot.",
    );
  }
  return deps;
}

/** @internal test-only. */
export function _resetDrupalAssistantDepsForTests(): void {
  _holder[DRUPAL_ASSISTANT_DEPS_KEY] = null;
}
