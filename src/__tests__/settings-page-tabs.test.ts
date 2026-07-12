// Regression pins for issue #34 (spec-driven tabbed setup page, Help tab
// last). The settings page is an async server component composed from
// `@cinatra-ai/sdk-ui/*` primitives that this connector package does not
// resolve in isolation (host-provided at build time — see ci.yml's
// first-party-peer skip), so — matching this repo's node-only test
// environment (google-calendar-connector#45's precedent) — these pins assert
// against the authored source of `../settings-page.tsx` rather than an actual
// React render.

import { describe, it, expect } from "vitest";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const srcDir = fileURLToPath(new URL("..", import.meta.url));
const src = readFileSync(
  fileURLToPath(new URL("../settings-page.tsx", import.meta.url)),
  "utf8",
);

// Collapse insignificant JSX whitespace so multi-line elements match as text.
const flat = src.replace(/\s+/g, " ");

describe("settings-page — tabbed setup layout (Help last)", () => {
  it("uses the shared sdk-ui Tabs primitive — no copied tabs.tsx anywhere under src/", () => {
    expect(src).toContain(
      'import { Tabs, TabsListRow, TabsTrigger, TabsContent } from "@cinatra-ai/sdk-ui/tabs";',
    );
    expect(src).toContain(
      'import { ConnectorSetupPage } from "@cinatra-ai/sdk-ui/connector-setup-page";',
    );
    // Boundary respect: no local tabs.tsx / hand-rolled tablist shipped
    // alongside — the file itself never defines a role="tablist" element...
    expect(src).not.toContain('role="tablist"');
    // ...and no vendored copy exists on disk anywhere under src/ (including
    // src/components/ui/, where a copy-pasted primitive would most likely
    // land).
    const findFile = (dir: string, name: string): boolean =>
      readdirSync(dir, { withFileTypes: true }).some((entry) => {
        const p = `${dir}/${entry.name}`;
        if (entry.isDirectory()) return findFile(p, name);
        return entry.name === name;
      });
    expect(existsSync(srcDir)).toBe(true);
    expect(findFile(srcDir, "tabs.tsx")).toBe(false);
  });

  it("declares exactly three tabs, in order: Setup, MCP, Help (Help always last), with matching visible labels", () => {
    const order = [...flat.matchAll(/<TabsTrigger value="(\w+)">([^<]+)<\/TabsTrigger>/g)].map(
      (m) => [m[1], m[2]],
    );
    expect(order).toEqual([
      ["setup", "Setup"],
      ["mcp", "MCP"],
      ["help", "Help"],
    ]);
  });

  it("carries a11y tab semantics: TabsListRow is labelled and precedes every TabsContent", () => {
    expect(src).toContain('<TabsListRow aria-label="Drupal Widget connector setup">');
    const listAt = src.indexOf("<TabsListRow");
    const firstContentAt = src.indexOf("<TabsContent");
    expect(listAt).toBeGreaterThan(-1);
    expect(firstContentAt).toBeGreaterThan(listAt);
  });

  it('the "setup" tab maps to the credentials form (Generate/Regenerate + Cinatra URL + API key fields)', () => {
    const setupBlock = flat.slice(
      flat.indexOf('<TabsContent value="setup"'),
      flat.indexOf('<TabsContent value="mcp"'),
    );
    expect(setupBlock).toContain("Cinatra URL");
    expect(setupBlock).toContain("API key");
    expect(setupBlock).toContain("generateCredentialsAction");
    expect(setupBlock).toContain('{config ? "Regenerate credentials" : "Generate credentials"}');
    // No stale duplicate section heading — the tab label already names it.
    expect(setupBlock).not.toContain("Module credentials");
  });

  it('the "setup" tab pins BOTH the null-config empty state and the populated-config field render', () => {
    const setupBlock = flat.slice(
      flat.indexOf('<TabsContent value="setup"'),
      flat.indexOf('<TabsContent value="mcp"'),
    );
    // Null-config (no credentials generated yet) branch: the exact empty-state
    // copy, gated by `!config`.
    expect(setupBlock).toMatch(
      /\{!config \? \( <p className="text-sm text-muted-foreground"> No credentials generated yet\. Click Generate credentials to create an API key\. <\/p> \) : \(/,
    );
    // Populated-config branch: the "last generated" copy + both fields render
    // inside the `: (` else-branch of the same ternary.
    const elseBranch = setupBlock.slice(setupBlock.indexOf(") : ("));
    expect(elseBranch).toContain("Last generated {generatedAt}");
    expect(elseBranch).toContain("<FieldLabel>Cinatra URL</FieldLabel>");
    expect(elseBranch).toContain("<FieldLabel>API key</FieldLabel>");
  });

  it('the "mcp" tab maps to the Drupal MCP Tools server status section (per-instance list)', () => {
    const mcpBlock = flat.slice(
      flat.indexOf('<TabsContent value="mcp"'),
      flat.indexOf('<TabsContent value="help"'),
    );
    expect(mcpBlock).toContain("<DrupalMcpToolsSection");
    expect(mcpBlock).toContain("mcpStatuses={mcpStatuses}");
  });

  it('the "help" tab maps to the setup how-to (read-only: no form, no Save) and is the LAST TabsContent', () => {
    const helpAt = flat.indexOf('<TabsContent value="help"');
    const helpBlock = flat.slice(helpAt, flat.indexOf("</Tabs>"));
    expect(helpBlock).toContain("Install the drupal/mcp_tools module");
    expect(helpBlock).toContain("DRUPAL_CONTENT_EDITOR_A2A_URL");
    expect(helpBlock).not.toContain("<form");
    expect(helpBlock).not.toContain(">Save<");

    // Help is the LAST TabsContent block in source order.
    const allContentTags = [...flat.matchAll(/<TabsContent value="(\w+)"/g)].map((m) => m[1]);
    expect(allContentTags[allContentTags.length - 1]).toBe("help");
  });

  it("the Help tab cross-references the Setup tab for credential generation", () => {
    expect(flat).toContain("Generate credentials in the <strong>Setup</strong> tab");
  });
});

describe("DrupalMcpToolsSection — status rendering (extracted for tab-content pinning)", () => {
  it("stays module-local — NOT exported, so the public './settings-page' subpath surface is unchanged", () => {
    expect(src).not.toContain("export function DrupalMcpToolsSection(");
    expect(src).toContain("function DrupalMcpToolsSection(");
  });

  it("drops the in-content section heading — the MCP tab label already names it", () => {
    const sectionSrc = src.slice(src.indexOf("function DrupalMcpToolsSection"));
    expect(sectionSrc).not.toContain(">Drupal MCP Tools server<");
  });

  it("empty and populated per-instance states are both pinned in the section body", () => {
    const sectionSrc = flat.slice(flat.indexOf("function DrupalMcpToolsSection"));
    // Empty state: no Drupal instances configured yet.
    expect(sectionSrc).toContain("No Drupal instances configured");
    // Populated state: per-instance status badge + hint copy for each
    // reachability status this connector's deps type can report.
    expect(sectionSrc).toContain('s.isPrivate ? "outline" : s.status === "registered" ? "default" : "secondary"');
    expect(sectionSrc).toContain("Local/private URL");
    expect(sectionSrc).toContain("Credentials rejected");
    expect(sectionSrc).toContain("Module not enabled");
    expect(sectionSrc).toContain("Site unreachable");
  });
});
