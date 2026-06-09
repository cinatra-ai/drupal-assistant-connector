# Testing Patterns

**Analysis Date:** 2026-06-09

## Test Framework

**Runner:**
- Vitest (declared in `package.json` scripts: `"test": "vitest"`)
- No `vitest.config.*` file detected at the repo root — Vitest runs with defaults or picks up config from the consuming monorepo workspace.

**Assertion Library:**
- Vitest built-in (`expect`)

**Run Commands:**
```bash
pnpm test          # Run all tests (via Vitest)
```

Watch mode and coverage commands are not explicitly configured in `package.json`. With Vitest defaults:
```bash
pnpm test --watch        # Watch mode
pnpm test --coverage     # Coverage (requires @vitest/coverage-v8 or similar)
```

## Test File Organization

**Location:**
- No test files are present in this repository. The repo is a **Cinatra source mirror** (connector kind) — it declares host-internal `@cinatra-ai/*` packages as optional peers. The CI pipeline (`ci.yml`) explicitly skips standalone tests for source-mirror repos and defers to the consuming cinatra monorepo.

**Expected naming (Vitest default):**
- `*.test.ts` / `*.test.tsx` co-located with source files, or in a `__tests__/` subdirectory

## Test Structure

**Suite Organization:**
- Not applicable — no tests are present in this repo.

**CI behavior:**
The `Test` step in `.github/workflows/ci.yml` skips execution for this repo:
```yaml
- name: Test
  run: |
    if [ "$first_party" = "1" ]; then
      echo "Skipping standalone tests (host-internal @cinatra-ai/* peers — the cinatra monorepo runs these)."
      exit 0
    fi
    corepack pnpm test --if-present
```
The `first_party=1` flag is set because this package declares `@cinatra-ai/sdk-extensions` and `@cinatra-ai/sdk-ui` as optional peers.

## Mocking

**Framework:** Not applicable — no tests present.

**Expected pattern (Vitest):**
```typescript
import { vi } from "vitest";
vi.mock("../lib/utils");
```

## Fixtures and Factories

**Test Data:** Not applicable — no tests present.

## Coverage

**Requirements:** Not enforced — no coverage threshold configuration detected.

**Coverage command (Vitest default):**
```bash
pnpm test --coverage
```

## Test Types

**Unit Tests:** No unit tests present. Utilities in `src/lib/utils.ts` (e.g., `slugify`, `formatCurrencyMillions`, `compareValues`, `getPageNumbers`) are candidates for unit testing.

**Integration Tests:** Not present.

**E2E Tests:** Not present.

## Notes on Testability

- Pure utility functions in `src/lib/utils.ts` have no side effects and are straightforward to unit-test with Vitest.
- `settings-page.tsx` is a Next.js async Server Component importing `"server-only"` and making calls to `@cinatra-ai/sdk-extensions` and app-level `@/lib/*` modules. These are only resolvable in the monorepo environment, making standalone integration testing infeasible without mocking.
- `copy-button.tsx` is a client component testable with `@testing-library/react` under jsdom.

---

*Testing analysis: 2026-06-09*
