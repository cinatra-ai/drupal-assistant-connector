import "server-only";

import type { Metadata } from "next";
import { revalidatePath } from "next/cache";
import Link from "next/link";

import { Badge } from "./components/ui/badge";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { FieldGroup, Field, FieldLabel } from "./components/ui/field";
import { ConnectorSetupPage } from "@cinatra-ai/sdk-ui/connector-setup-page";
// Shared design-system Tabs primitive (cinatra-ai/cinatra#1103) — own subpath
// only, deliberately NOT re-exported from `/marketplace` (route-graph
// ratchet). TabsListRow pairs the tablist with the etched section rule so the
// composition is never hand-rolled.
import { Tabs, TabsListRow, TabsTrigger, TabsContent } from "@cinatra-ai/sdk-ui/tabs";
import { CopyButton } from "./copy-button";
import { requireExtensionAction } from "@cinatra-ai/sdk-extensions";
// Widget auth-config read/generate + per-instance MCP statuses resolve via the
// deps slot (cinatra#172 Stage H2): `@/lib/drupal-widget-auth` /
// `@/lib/drupal-mcp-connection` stay host-side, adapted by register(ctx) from
// `@cinatra-ai/host:drupal-widget-auth` + `@cinatra-ai/host:drupal-mcp`. The
// "use server" action CANNOT close over render-time props, so the globalThis
// deps slot is the only seam that reaches it.
import { getDrupalAssistantDeps, type DrupalAssistantConnectorDeps } from "./deps";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Drupal Widget | Cinatra" };

async function generateCredentialsAction(): Promise<void> {
  "use server";
  await requireExtensionAction("@cinatra-ai/drupal-assistant-connector", "manage");
  try {
    getDrupalAssistantDeps().generateWidgetAuthConfig();
    revalidatePath("/connectors/cinatra-ai/drupal-assistant-connector/setup");
  } catch (err) {
    console.error("[drupal-widget] generateCredentialsAction failed:", err);
    throw new Error("Failed to generate credentials. Please try again.");
  }
}

export async function DrupalAssistantSettingsPage() {
  await requireExtensionAction("@cinatra-ai/drupal-assistant-connector", "read");
  const config = getDrupalAssistantDeps().readWidgetAuthConfig();
  const cinatraUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.BETTER_AUTH_URL ??
    "http://localhost:3000";
  const generatedAt = config?.generatedAt ? new Date(config.generatedAt).toLocaleString() : null;
  const mcpStatuses = await getDrupalAssistantDeps().listMcpInstanceStatuses();

  return (
    // Standard connector-setup PAGE chrome — header + content in the SAME
    // Wide column (app-connectors.html §II). `divider={false}` — the section
    // rule is the tab row's etched rule, so the two never stack.
    <ConnectorSetupPage
      title="Drupal Widget"
      description="Generate credentials for the Cinatra Drupal module (cinatra)."
      divider={false}
      className="flex flex-col gap-6 pb-8"
    >
      <Tabs defaultValue="setup">
        <TabsListRow aria-label="Drupal Widget connector setup">
          {/* "Setup" is the primary/overview tab — app-connectors.html §II. */}
          <TabsTrigger value="setup">Setup</TabsTrigger>
          <TabsTrigger value="mcp">MCP</TabsTrigger>
          {/* Help is the reserved tab — always last (app-connectors §II). */}
          <TabsTrigger value="help">Help</TabsTrigger>
        </TabsListRow>

        {/* SETUP — this connector has one credential set (no connection
            model to speak of: it mints a single widget API key), so the tab
            is a form-only config tab. Card-less, Narrow (max-w-xl · 576px),
            flush-left under the tablist per §II. The in-content section
            heading is dropped — the tab label already names the section. */}
        <TabsContent value="setup" className="mt-6 w-full max-w-xl">
          <section className="flex flex-col gap-4">
            {!config ? (
              <p className="text-sm text-muted-foreground">
                No credentials generated yet. Click Generate credentials to create an API key.
              </p>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  Last generated {generatedAt}. Regenerating immediately invalidates the previous values.
                </p>
                <FieldGroup>
                  <Field>
                    <FieldLabel>Cinatra URL</FieldLabel>
                    <div className="flex items-center gap-2">
                      <Input readOnly value={cinatraUrl} className="font-mono text-sm" />
                      <CopyButton value={cinatraUrl} />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Paste into the Drupal module&apos;s cinatra_url config field.
                    </p>
                  </Field>
                  <Field>
                    <FieldLabel>API key</FieldLabel>
                    <div className="flex items-center gap-2">
                      <Input readOnly value={config.apiKey} className="font-mono text-sm" />
                      <CopyButton value={config.apiKey} />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Paste into the Drupal module&apos;s api_key config field. Used as Authorization: Bearer &lt;key&gt; by the widget.
                    </p>
                  </Field>
                </FieldGroup>
              </>
            )}

            {/* Contract rule: the action button sits at the END of the tab
                content, below the fields — matching the spec config-tab
                render where the primary action closes the content ("ending
                in its own Save", app-connectors.html §II). */}
            <form action={generateCredentialsAction} className="mt-2">
              <Button type="submit" variant={config ? "outline" : "default"}>
                {config ? "Regenerate credentials" : "Generate credentials"}
              </Button>
            </form>
          </section>
        </TabsContent>

        {/* Drupal MCP Tools server — per-instance status. Narrow (max-w-xl),
            flush-left under the tablist (no mx-auto). */}
        <TabsContent value="mcp" className="mt-6 w-full max-w-xl">
          <DrupalMcpToolsSection mcpStatuses={mcpStatuses} />
        </TabsContent>

        {/* Help — reserved, always-last, read-only (no form, no Save).
            Narrow, flush-left, card-less (§II custom-tab frame rule). */}
        <TabsContent value="help" className="mt-6 w-full max-w-xl">
          <section className="flex w-full flex-col gap-3">
            <ol className="flex flex-col gap-2 text-sm text-muted-foreground list-decimal pl-4">
              <li>Install the drupal/mcp_tools module on your Drupal site (Composer + Drush).</li>
              <li>Bind-mount or enable the Cinatra module (dev/drupal-module/cinatra) on your Drupal site.</li>
              <li>
                Generate credentials in the <strong>Setup</strong> tab (creates an API key).
              </li>
              <li>In Drupal, go to Configuration &rsaquo; Web services &rsaquo; Cinatra and paste the two values.</li>
              <li>A floating Cinatra button appears in the bottom-right corner of every node page (frontend + admin edit form) for authenticated users.</li>
            </ol>
            <p className="text-xs text-muted-foreground">
              Note: If Cinatra runs inside Docker, set{" "}
              <code className="rounded-chip bg-surface-strong px-1 py-0.5 text-xs">DRUPAL_CONTENT_EDITOR_A2A_URL=http://wayflow-drupal-content-editor:3020</code>{" "}
              in .env.local.
            </p>
          </section>
        </TabsContent>
      </Tabs>
    </ConnectorSetupPage>
  );
}

// Kept module-local (not exported): the "./settings-page" subpath is a
// public package export, so widening its surface here would be a real
// boundary change. The settings-page-tabs test pins this section's content
// via the source-text mapping instead of a direct render/import.
function DrupalMcpToolsSection({
  mcpStatuses,
}: {
  mcpStatuses: Awaited<ReturnType<DrupalAssistantConnectorDeps["listMcpInstanceStatuses"]>>;
}) {
  return (
    // Card-less tab content (§II: "the form is never wrapped in its own
    // card"). The per-instance rows below keep their own subordinate record
    // cards. The in-content section heading ("Drupal MCP Tools server") is
    // dropped — the tab label already names the section.
    <section className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Cinatra automatically registers the drupal/mcp_tools module as an MCP server for each configured Drupal site. Install the module on each Drupal site — once reachable, its tools are available to all Cinatra agents automatically.
      </p>
      {mcpStatuses.length === 0 ? (
        <div className="rounded-card border border-line bg-surface p-4 text-sm text-muted-foreground">
          No Drupal instances configured. Add a Drupal connector in{" "}
          <Button
            asChild
            variant="link"
            className="inline h-auto whitespace-normal p-0 text-[length:inherit] font-normal text-inherit underline underline-offset-2 hover:text-foreground"
          >
            <Link href="/connectors/drupal">Connectors &rsaquo; Drupal</Link>
          </Button>{" "}
          to enable the MCP integration.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {mcpStatuses.map((s) => {
            const variant: "default" | "outline" | "secondary" =
              s.isPrivate ? "outline" : s.status === "registered" ? "default" : "secondary";
            const label =
              s.isPrivate ? "Local only" : s.status === "registered" ? "Registered" : "Not detected";
            const hint =
              s.isPrivate
                ? `Local/private URL — module is reachable but agents cannot use it because external LLM providers cannot connect to private addresses. Use a public URL or tunnel (e.g. Cloudflare Tunnel) to enable agent access.`
                : s.status === "registered"
                  ? null
                  : s.status === "auth_error"
                    ? `Credentials rejected. Check that the Bearer key in Drupal connector administration has the read,write scopes.`
                    : s.status === "not_installed"
                      ? `Module not enabled. Install drupal/mcp_tools and enable the mcp_tools_remote submodule on this site.`
                      : `Site unreachable. Check that ${s.siteUrl} is accessible from this server.`;
            return (
              <div key={s.id} className="rounded-card flex flex-col gap-1 border border-line p-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">{s.name}</span>
                  <Badge variant={variant}>{label}</Badge>
                </div>
                <span className="text-xs text-muted-foreground">{s.siteUrl}</span>
                {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
