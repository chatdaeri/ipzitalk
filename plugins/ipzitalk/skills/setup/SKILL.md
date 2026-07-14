---
name: setup
description: Configure, inspect, switch, or remove the Ipzi Talk Remote or OSS runtime payload. Use only when the user explicitly invokes Ipzi Talk setup or asks to manage the installed Ipzi Talk mode.
---

# Configure Ipzi Talk

Manage the runtime through platform plugin commands. Treat the installed plugin list as the only state source. Never create a separate state file or edit Codex configuration directly.

This build is an internal Codex canary. Remote setup is available; the OSS payload is added in the next implementation checkpoint. Do not represent the canary as a public release.

## Inspect state

1. Run `codex plugin list --json` after obtaining shell approval when required.
2. Locate `ipzitalk-remote` and `ipzitalk-local` by exact plugin ID.
3. Derive one of four states: `Remote`, `OSS`, `not installed`, or `conflict`.
4. If both payloads are installed or enabled, stop. Explain the conflict and do not remove either automatically.
5. Ignore unrelated plugins and user-managed MCP servers. Never delete or rewrite them.

For a status-only request, report the derived state and stop without changing anything.

## Explain the modes

Before making a change, explain:

- Remote uses the hosted Ipzi Talk MCP, OAuth, and hosted data. The internal canary contains no Remote Skills yet.
- OSS runs `presale-mcp` locally through Node.js and requires the user's four API keys. OSS is MCP-only and does not include or claim compatibility with Remote Skills.
- Only one runtime payload is supported at a time.

Ask the user to choose explicitly. Do not select a default. In this canary, if the user selects OSS, explain that `ipzitalk-local` is not packaged yet and make no changes.

## Install Remote

1. Show the exact command and its effect: `codex plugin add ipzitalk-remote@ipzitalk --json`.
2. Ask for approval before running it.
3. If an opposite managed payload is present, remove it first with a separate approval. If removal fails or is declined, do not install Remote.
4. Run the add command only after approval.
5. Re-run `codex plugin list --json` and `codex mcp list --json` and confirm that only the Remote payload is present.
6. Tell the user whether a new thread, CLI restart, or app restart is required based on observed behavior. Do not promise hot loading.

## Switch or remove

Use `codex plugin remove <plugin>@ipzitalk --json` for the exact managed payload only.

For a future Remote-to-OSS or OSS-to-Remote switch:

1. Show and approve the exact remove command.
2. Remove the old payload.
3. If removal fails, stop before installation.
4. Show and approve the exact add command for the new payload.
5. If addition fails, derive the state as `not installed` and offer the old payload's reinstall command as another separately approved action.

Removing the `ipzitalk` launcher must not automatically remove a runtime payload. For complete removal, remove the runtime first and the launcher second, with separate approval for each action.

## Security boundaries

- Never request, echo, write, or place API keys in command arguments.
- Never edit `~/.codex/config.toml`, a marketplace file, or a plugin cache by hand.
- Never remove an unknown plugin or a manually configured MCP server.
- Never claim Remote and OSS can run together safely.
