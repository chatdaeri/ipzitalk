---
name: setup
description: Configure, inspect, switch, or remove the Ipzi Talk Remote or OSS runtime payload. Use only when the user explicitly invokes Ipzi Talk setup or asks to manage the installed Ipzi Talk mode.
---

# Configure Ipzi Talk

Manage the runtime through the current platform's plugin commands. Treat that platform's installed plugin list as the only state source. Never create a separate state file or edit platform configuration directly.

This build is an internal Codex proof of concept. Both payloads are packaged, but the OSS registry command is a static contract until npm publication is completed. Do not represent this build as a public release.

## Inspect state

1. Identify the current client. Use `codex plugin list --json` in Codex or `claude plugin list --json` in Claude Code after obtaining shell approval when required.
2. Locate `ipzitalk-remote` and `ipzitalk-local` by exact plugin ID.
3. Derive one of four states: `Remote`, `OSS`, `not installed`, or `conflict`.
4. If both payloads are installed or enabled, stop. Explain the conflict and do not remove either automatically.
5. Ignore unrelated plugins and user-managed MCP servers. Never delete or rewrite them.
6. In Codex, treat the expected `ipzitalk-remote:<skill-name>` entries as the only packaged Remote Skill provenance. If an expected prefixed Skill is missing, or the same base name is also exposed from a global/non-plugin source, report `skill provenance conflict` and stop before a Skill-driven request. Do not remove or rewrite the global Skill automatically.

For a status-only request, report the derived state and stop without changing anything.

## Explain the modes

Before making a change, explain:

- Remote uses the hosted Ipzi Talk MCP, OAuth, hosted data, and the five packaged Remote Skills.
- OSS runs `presale-mcp` locally through Node.js and requires the user's four API keys. OSS is MCP-only, exposes ten tools, and does not include or claim compatibility with Remote Skills.
- Codex CLI forwards the four API keys only from its existing process environment through `env_vars`. Do not ask the user to paste them into chat, command arguments, manifests, or configuration examples with real values.
- Codex Desktop OSS is not supported in this proof of concept until a safe secret-delivery path is verified. Do not assume a Finder/Dock-launched app inherits shell exports.
- Claude Code stores the four OSS values through `userConfig` fields marked `required` and `sensitive`. The user must enter them in the plugin configure UI; never pass values through `claude plugin install --config` because command arguments can be logged.
- Only one runtime payload is supported at a time.

Ask the user to choose explicitly. Do not select a default and do not install a payload before the choice.

## Install Remote

1. Show the exact current-platform command and its effect: `codex plugin add ipzitalk-remote@ipzitalk --json` or `claude plugin install ipzitalk-remote@ipzitalk --scope user`.
2. Ask for approval before running it.
3. If an opposite managed payload is present, remove it first with a separate approval. If removal fails or is declined, do not install Remote.
4. Run the add command only after approval.
5. Re-run the platform plugin list and confirm that only the Remote payload is present. In Codex also run `codex mcp list --json`. In Claude Code ask the user to run `/reload-plugins`, then verify through `/mcp`.
6. Codex requires a new process for this PoC. Claude Code requires the user to run `/reload-plugins` after install, enable, disable, or remove. Do not promise hot loading.

## Install OSS

1. Confirm that Node.js 18 or later is available and `npx` is on `PATH`.
2. In Codex CLI, check only whether the four required environment-variable names are present. Never print their values. In Claude Code, explain that the plugin configure UI securely prompts for the four required sensitive `userConfig` values.
3. Explain that the committed runtime command is `npx -y presale-mcp@0.1.0`, but registry installation is not complete until the package is published in Phase 4.
4. Show the exact plugin command and its effect: `codex plugin add ipzitalk-local@ipzitalk --json` in Codex CLI or `claude plugin install ipzitalk-local@ipzitalk --scope user` in Claude Code.
5. Ask for approval before running it. If Remote is installed, remove it first with a separate approval and stop if removal fails or is declined.
6. After installation, inspect the platform plugin list and confirm that only the OSS managed payload is present. In Codex run `codex mcp list --json`; in Claude Code have the user configure all four sensitive fields and then run `/reload-plugins` and `/mcp`. Confirm that no secret values appear.
7. Start a new Codex CLI process for Codex verification. In Claude Code, use the reloaded session. Do not claim Codex Desktop, Claude Desktop Chat/Cowork, or Claude web-session support.

## Switch or remove

Use `codex plugin remove <plugin>@ipzitalk --json` in Codex or `claude plugin uninstall <plugin>@ipzitalk` in Claude Code for the exact managed payload only.

For a future Remote-to-OSS or OSS-to-Remote switch:

1. Show and approve the exact remove command.
2. Remove the old payload.
3. If removal fails, stop before installation.
4. Re-run the platform plugin list and confirm that the exact old payload is absent. A successful remove exit status alone is insufficient; Codex may report success when the plugin was already absent.
5. Show and approve the exact add command for the new payload.
6. If addition fails, derive the state as `not installed` and offer the old payload's reinstall command as another separately approved action.

Removing the `ipzitalk` launcher must not automatically remove a runtime payload. For complete removal, remove the runtime first and the launcher second, with separate approval for each action.

In Claude Code, ask the user to run `/reload-plugins` after each completed payload change before verification. Slash commands are user actions; do not claim to have run them from the shell.

## Security boundaries

- Never request, echo, write, or place API keys in command arguments.
- When checking environment variables, report only `set` or `missing` for each required name.
- Never edit `~/.codex/config.toml`, Claude settings or credential files, a marketplace file, or a plugin cache by hand.
- Never place Claude sensitive `userConfig` values in `--config` arguments, shell history, logs, or documentation.
- Never remove an unknown plugin or a manually configured MCP server.
- Never claim Remote and OSS can run together safely.
