# Drupal Assistant

Generate and manage the credentials that connect the Cinatra Drupal widget module to your workspace. Once configured, a floating Cinatra assistant button appears on every Drupal node page for authenticated users, so editors can launch the assistant without leaving Drupal. Setup takes two steps: generate credentials here, then paste two values (a URL and an API key) into the Drupal module configuration form. Regenerating credentials immediately invalidates the previous values. The connector also surfaces the per-site reachability status of the drupal/mcp_tools MCP server, so you can confirm each Drupal site is fully wired before asking agents to act on Drupal content. If a site shows "Local only", its URL is private and external LLM providers cannot reach it; use a public URL or a tunnel such as Cloudflare Tunnel to enable agent access. For development, run `pnpm test` to execute unit tests and `pnpm lint` to check sources. Common failure: if no credentials have been generated yet, the Drupal module cannot authenticate and will not render the assistant widget.

## Works with

- Cinatra Drupal widget module (cinatra) installed on your Drupal site
- drupal/mcp_tools Drupal module for MCP server integration (optional; enables agent-to-Drupal tool calls)

## Capabilities

- Generate the API key and display the Cinatra URL required by the Drupal widget module
- Copy credentials to paste into Drupal's Configuration › Web services › Cinatra form
- Regenerate credentials to rotate the API key (immediately invalidates the previous key)
- Show per-site drupal/mcp_tools MCP server reachability status (registered, not installed, auth error, or unreachable)
