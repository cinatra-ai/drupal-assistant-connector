// The host's own address reaches the settings page through the ambient
// runtime port: `register(ctx)` binds it as a lazy member of the deps slot.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { register } from "../register";
import { getDrupalAssistantDeps, _resetDrupalAssistantDepsForTests } from "../deps";

function activate(publicBaseUrl: () => string | null) {
  const spy = vi.fn(publicBaseUrl);
  const ctx = {
    capabilities: { registerProvider: () => {}, resolveProviders: () => [] },
    runtime: { publicBaseUrl: spy },
  };
  register(ctx as never);
  return spy;
}

beforeEach(() => {
  _resetDrupalAssistantDepsForTests();
});

afterEach(() => {
  _resetDrupalAssistantDepsForTests();
  vi.restoreAllMocks();
});

describe("register(ctx) — public base URL from the ambient runtime port", () => {
  it("R1: the bound member returns the runtime port's value", () => {
    activate(() => "https://app.example.test");
    expect(getDrupalAssistantDeps().publicBaseUrl?.()).toBe("https://app.example.test");
  });

  it("R2: the runtime port is read lazily — never at registration, once per call", () => {
    const spy = activate(() => "https://app.example.test");
    expect(spy).toHaveBeenCalledTimes(0);
    getDrupalAssistantDeps().publicBaseUrl?.();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("R3: a runtime port that reports no address yields null and throws nothing", () => {
    activate(() => null);
    expect(() => getDrupalAssistantDeps().publicBaseUrl?.()).not.toThrow();
    expect(getDrupalAssistantDeps().publicBaseUrl?.()).toBeNull();
  });
});
