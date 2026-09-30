// Source-text pins for the settings page's address read. The page cannot be
// rendered in this package's node-only tests (see settings-page-tabs.test.ts),
// so the authored source is pinned instead. The file system module is loaded
// through a computed specifier, typed locally, so the package's standalone
// typecheck (no node typings) gains no line.

import { describe, it, expect } from "vitest";

type FsLike = {
  readFileSync: (p: URL, enc: "utf8") => string;
  readdirSync: (p: URL, o: { withFileTypes: true }) => Array<{
    name: string;
    isDirectory: () => boolean;
  }>;
};
const fs = (await import("node:" + "fs")) as unknown as FsLike;

const srcRoot = new URL("../", import.meta.url);
const read = (u: URL) => fs.readFileSync(u, "utf8");
const pageSrc = read(new URL("../settings-page.tsx", import.meta.url));
const flat = pageSrc.replace(/\s+/g, " ");

function listSources(dir: URL, out: URL[] = []): URL[] {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === "__tests__") continue;
    if (e.isDirectory()) listSources(new URL(e.name + "/", dir), out);
    else if (/\.tsx?$/.test(e.name)) out.push(new URL(e.name, dir));
  }
  return out;
}

describe("settings-page — address read through the host runtime port", () => {
  it("P1 no shipped source file reads the process environment directly", () => {
    const pattern = new RegExp("\\bprocess" + "\\.env\\b");
    const files = listSources(srcRoot);
    expect(files.length).toBeGreaterThan(0);
    const offenders = files.filter((f) => pattern.test(read(f))).map((f) => f.pathname);
    expect(offenders).toEqual([]);
  });

  it("P2 reads the address at one site, through the deps member", () => {
    expect(flat).toContain(
      'const cinatraUrl = getDrupalAssistantDeps().publicBaseUrl?.() ?? "http://localhost:3000";',
    );
    expect(pageSrc.split("publicBaseUrl").length - 1).toBe(1);
    expect(pageSrc.split('"http://localhost:3000"').length - 1).toBe(1);
  });

  it("P3 still shows the address in the read-only field and its copy button", () => {
    expect(flat).toContain('<Input readOnly value={cinatraUrl} className="font-mono text-sm" />');
    expect(flat).toContain("<CopyButton value={cinatraUrl} />");
  });

  it("P4 declares the deps member as optional", () => {
    const deps = read(new URL("../deps.ts", import.meta.url));
    expect(deps).toContain("publicBaseUrl?: () => string | null;");
  });
});
