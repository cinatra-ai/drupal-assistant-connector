// `register(ctx)` shape — the cinatra#172 Stage H2 serverEntry cutover: the
// connector binds its host deps slot itself (always-bind, lazy per-call
// host-service resolution over `@cinatra-ai/host:drupal-widget-auth` +
// `@cinatra-ai/host:drupal-mcp`). Leaf-graph pin: the entry imports ONLY
// ./deps. Slot-timing coverage: the slot is populated AT ACTIVATION — before
// the settings page / its "use server" action resolve it — and an unbound
// slot fails LOUD naming the package and the registration step.

import { describe, expect, it, vi, beforeEach } from "vitest";

import { register } from "../register";
import {
  getDrupalAssistantDeps,
  registerDrupalAssistantConnector,
  _resetDrupalAssistantDepsForTests,
} from "../deps";

function activateWithServices(impls: Record<string, unknown>) {
  const resolveProviders = vi.fn((capability: string) =>
    impls[capability] !== undefined
      ? [{ packageName: "@cinatra-ai/host", impl: impls[capability] }]
      : [],
  );
  const ctx = {
    capabilities: { registerProvider: () => {}, resolveProviders },
  } as never;
  register(ctx);
  return { resolveProviders };
}

beforeEach(() => {
  vi.clearAllMocks();
  _resetDrupalAssistantDepsForTests();
});

describe("register(ctx) — deps binding (cinatra#172 Stage H2)", () => {
  it("binds the deps slot at activation, resolving host services LAZILY at call time", async () => {
    const read = vi.fn(() => ({ apiKey: "k-1", generatedAt: "2026-01-01T00:00:00Z" }));
    const generate = vi.fn(() => ({ apiKey: "k-2", generatedAt: "2026-01-02T00:00:00Z" }));
    const getInstanceStatuses = vi.fn(async () => [
      { id: "i-1", name: "S", siteUrl: "https://d.example", status: "registered" as const, isPrivate: false },
    ]);
    const { resolveProviders } = activateWithServices({
      "@cinatra-ai/host:drupal-widget-auth": { read, generate },
      "@cinatra-ai/host:drupal-mcp": { getInstanceStatuses },
    });
    // No host-service resolution happened at registration (probe-safe), but
    // the slot IS bound — settings-page bundles resolving it later succeed.
    expect(resolveProviders).not.toHaveBeenCalled();

    expect(getDrupalAssistantDeps().readWidgetAuthConfig()).toEqual({
      apiKey: "k-1",
      generatedAt: "2026-01-01T00:00:00Z",
    });
    expect(getDrupalAssistantDeps().generateWidgetAuthConfig()).toEqual({
      apiKey: "k-2",
      generatedAt: "2026-01-02T00:00:00Z",
    });
    await expect(getDrupalAssistantDeps().listMcpInstanceStatuses()).resolves.toEqual([
      { id: "i-1", name: "S", siteUrl: "https://d.example", status: "registered", isPrivate: false },
    ]);
    expect(read).toHaveBeenCalledTimes(1);
    expect(generate).toHaveBeenCalledTimes(1);
    expect(getInstanceStatuses).toHaveBeenCalledTimes(1);
  });

  it("REPLACES a pre-bound deps slot (always-bind — a hot-update digest swap re-binds fresh resolvers)", () => {
    const sentinel = vi.fn(() => null);
    registerDrupalAssistantConnector({ readWidgetAuthConfig: sentinel } as never);
    activateWithServices({
      "@cinatra-ai/host:drupal-widget-auth": { read: () => null, generate: vi.fn() },
    });
    expect(getDrupalAssistantDeps().readWidgetAuthConfig()).toBeNull();
    expect(sentinel).not.toHaveBeenCalled();
  });

  it("fails LOUD (descriptive) on a missing host service at call time", () => {
    activateWithServices({});
    expect(() => getDrupalAssistantDeps().readWidgetAuthConfig()).toThrow(
      /host service "@cinatra-ai\/host:drupal-widget-auth" is not registered/,
    );
    expect(() => getDrupalAssistantDeps().listMcpInstanceStatuses()).toThrow(
      /host service "@cinatra-ai\/host:drupal-mcp" is not registered/,
    );
  });

  it("fails LOUD with the package name + registration step when the SLOT itself is unbound", () => {
    // No register(ctx) ran at all (e.g. a settings-page bundle resolving the
    // slot before activation): the getter must name the package and the
    // missing registration step.
    expect(() => getDrupalAssistantDeps()).toThrow(
      /@cinatra-ai\/drupal-assistant-connector: host runtime deps not registered[\s\S]*registerDrupalAssistantConnector/,
    );
  });
});
