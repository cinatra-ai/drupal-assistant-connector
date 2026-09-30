// Source-text pins for the settings page's address read. The page is an async
// server component over host-provided primitives that this package does not
// resolve in isolation, so — as settings-page-tabs.test.ts does — these arms
// assert against the authored source rather than a render. The file system
// module is loaded through a computed specifier so this file adds no line to
// the package's standalone typecheck (no node typings are declared here).

import { describe, expect, it } from "vitest";

type FsLike = {
  readFileSync(path: URL, enc: "utf8"): string;
  readdirSync(path: URL): string[];
  statSync(path: URL): { isDirectory(): boolean };
};

const fs = (await import("node:" + "fs")) as unknown as FsLike;

const srcRoot = new URL("../", import.meta.url);
const read = (rel: string) => fs.readFileSync(new URL(rel, srcRoot), "utf8");
const flat = (text: string) => text.replace(/\s+/g, " ");

function sourceFiles(dir: URL, rel = ""): string[] {
  const out: string[] = [];
  for (const name of fs.readdirSync(dir)) {
    if (rel === "" && name === "__tests__") continue;
    const child = new URL(name + "/", dir);
    if (fs.statSync(new URL(name, dir)).isDirectory()) {
      out.push(...sourceFiles(child, rel + name + "/"));
    } else if (/\.tsx?$/.test(name)) {
      out.push(rel + name);
    }
  }
  return out;
}

describe("settings-page — the address comes from the host runtime port", () => {
  it("P1: no source file outside the tests reads the process environment", () => {
    const accessor = new RegExp("\\bprocess" + "\\.env\\b");
    const offenders = sourceFiles(srcRoot).filter((f) => accessor.test(read(f)));
    expect(offenders).toEqual([]);
  });

  it("P2: the page reads the address at one site, through the deps member", () => {
    const page = flat(read("settings-page.tsx"));
    expect(page).toContain(
      'const cinatraUrl = getDrupalAssistantDeps().publicBaseUrl?.() ?? "http://localhost:3000";',
    );
    expect(page.split("publicBaseUrl").length - 1).toBe(1);
    expect(page.split('"http://localhost:3000"').length - 1).toBe(1);
  });

  it("P3: the read-only field and its copy button still show the address", () => {
    const page = flat(read("settings-page.tsx"));
    expect(page).toContain('<Input readOnly value={cinatraUrl} className="font-mono text-sm" />');
    expect(page).toContain("<CopyButton value={cinatraUrl} />");
  });

  it("P4: the deps member is optional", () => {
    expect(flat(read("deps.ts"))).toContain("publicBaseUrl?: () => string | null;");
  });
});
