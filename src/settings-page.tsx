import "server-only";

import type { Metadata } from "next";
import { revalidatePath } from "next/cache";

import { Badge } from "./components/ui/badge";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { FieldGroup, Field, FieldLabel } from "./components/ui/field";
import { Main, PageHeader, PageContent } from "@cinatra-ai/sdk-ui/marketplace";
import { CopyButton } from "./copy-button";
import { requireExtensionAction } from "@cinatra-ai/sdk-extensions";
// Widget auth-config read/generate + per-instance MCP statuses resolve via the
// deps slot (cinatra#172 Stage H2): `@/lib/drupal-widget-auth` /
// `@/lib/drupal-mcp-connection` stay host-side, adapted by register(ctx) from
// `@cinatra-ai/host:drupal-widget-auth` + `@cinatra-ai/host:drupal-mcp`. The
// "use server" action CANNOT close over render-time props, so the globalThis
// deps slot is the only seam that reaches it.
import { getDrupalAssistantDeps } from "./deps";

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
    <Main className="min-h-screen">
      <PageHeader
        title="Drupal Widget"
        description="Generate credentials for the Cinatra Drupal module (cinatra)."
      />
      <PageContent className="flex flex-col gap-6 pb-8">
        <div className="flex items-start gap-6">
          <section className="soft-panel flex min-w-0 flex-1 flex-col gap-4 p-6">
            <h2 className="text-base font-semibold text-foreground">Module credentials</h2>
            {!config ? (
              <>
                <p className="text-sm text-muted-foreground">
                  No credentials generated yet. Click Generate credentials to create an API key.
                </p>
                <form action={generateCredentialsAction}>
                  <Button type="submit">Generate credentials</Button>
                </form>
              </>
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
                <form action={generateCredentialsAction}>
                  <Button type="submit" variant="outline">Regenerate credentials</Button>
                </form>
              </>
            )}
          </section>

          <section className="soft-panel w-1/3 shrink-0 flex flex-col gap-3 p-6">
            <h2 className="text-base font-semibold text-foreground">Setup instructions</h2>
            <ol className="flex flex-col gap-2 text-sm text-muted-foreground list-decimal pl-4">
              <li>Install the drupal/mcp_tools module on your Drupal site (Composer + Drush).</li>
              <li>Bind-mount or enable the Cinatra module (dev/drupal-module/cinatra) on your Drupal site.</li>
              <li>Generate credentials above (creates an API key).</li>
              <li>In Drupal, go to Configuration &rsaquo; Web services &rsaquo; Cinatra and paste the two values.</li>
              <li>A floating Cinatra button appears in the bottom-right corner of every node page (frontend + admin edit form) for authenticated users.</li>
            </ol>
            <p className="text-xs text-muted-foreground">
              Note: If Cinatra runs inside Docker, set{" "}
              <code className="rounded-chip bg-surface-strong px-1 py-0.5 text-xs">DRUPAL_CONTENT_EDITOR_A2A_URL=http://wayflow-drupal-content-editor:3020</code>{" "}
              in .env.local.
            </p>
          </section>
        </div>

        <section className="soft-panel flex flex-col gap-3 p-6">
          <h2 className="text-base font-semibold text-foreground">Drupal MCP Tools server</h2>
          <p className="text-sm text-muted-foreground">
            Cinatra automatically registers the drupal/mcp_tools module as an MCP server for each configured Drupal site. Install the module on each Drupal site — once reachable, its tools are available to all Cinatra agents automatically.
          </p>
          {mcpStatuses.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No Drupal instances configured. Add a Drupal connector in{" "}
              <a href="/connectors/drupal" className="underline underline-offset-4">Connectors &rsaquo; Drupal</a>{" "}
              to enable the MCP integration.
            </p>
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
      </PageContent>
    </Main>
  );
}
