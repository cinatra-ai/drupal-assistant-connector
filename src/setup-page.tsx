// Dispatch-route entry — mounted by the dynamic /connectors catch-all via
// src/lib/connector-setup-pages.ts.
import { DrupalAssistantSettingsPage } from "./settings-page";

type ConnectorSetupPageProps = {
  packageId: string;
  slug: string;
  searchParams: Record<string, string | string[] | undefined>;
};

export default async function DrupalAssistantConnectorSetupPage(
  _props: ConnectorSetupPageProps,
) {
  return DrupalAssistantSettingsPage();
}
