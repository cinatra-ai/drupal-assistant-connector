// The bound deps member that serves the host's own address through the
// ambient runtime port: bound lazily at registration, null passed through.

import { describe, expect, it, vi, beforeEach } from "vitest";

import { register } from "../register";
import { getDrupalAssistantDeps, _resetDrupalAssistantDepsForTests } from "../deps";

function activateWithRuntime(publicBaseUrl: () => string | null) {
  const spy = vi.fn(publicBaseUrl);
  const ctx = {
    capabilities: { registerProvider: () => {}, resolveProviders: () => [] },
    runtime: { publicBaseUrl: spy },
  };
  register(ctx as never);
  return spy;
}

beforeEach(() => {
  vi.clearAllMocks();
  _resetDrupalAssistantDepsForTests();
});

describe("register(ctx) — public base URL from the ambient runtime port", () => {
  it("R1 binds a member that returns the runtime's address", () => {
    activateWithRuntime(() => "https://app.example.test");
    expect(getDrupalAssistantDeps().publicBaseUrl?.()).toBe("https://app.example.test");
  });

  it("R2 is lazy: zero calls at registration, one call per bound-member call", () => {
    const spy = activateWithRuntime(() => "https://app.example.test");
    expect(spy).toHaveBeenCalledTimes(0);
    getDrupalAssistantDeps().publicBaseUrl?.();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("R3 passes a null address through without throwing", () => {
    activateWithRuntime(() => null);
    expect(() => getDrupalAssistantDeps().publicBaseUrl?.()).not.toThrow();
    expect(getDrupalAssistantDeps().publicBaseUrl?.()).toBeNull();
  });
});
