# Claude Code canary validation — 2026-07-14

## Environment and static validation

- Claude Code CLI: `2.1.208`
- `claude plugin validate --strict .`: passed
- Launcher strict validation: passed
- Remote strict validation: passed
- OSS strict validation: passed
- Source-controlled package validation: passed

The Claude marketplace contains the recommended `ipzitalk` launcher and the two runtime payloads. Remote and OSS declare MCP servers inline in their Claude manifests; the Codex companion `.mcp.json` files are not referenced by the Claude manifests.

## Isolated install

An isolated `CLAUDE_CONFIG_DIR` added the local marketplace and installed the launcher and Remote payload. `claude plugin details` reported:

```text
ipzitalk
  Skills (1): setup
  MCP servers (0)

ipzitalk-remote
  Skills (5)
  MCP servers (1): ipzitalk
```

The installed Remote plugin list contained one `ipzitalk` MCP definition with the expected hosted URL. This confirms that the inline manifest definition replaced default companion discovery rather than loading the Codex `.mcp.json` as a second server.

The documented Claude invocation is `/ipzitalk:setup`. A live interactive `/reload-plugins` and slash-command invocation were not performed in the isolated config because it did not contain an authenticated Claude session.

## OSS user configuration

The same isolated config installed `ipzitalk-local` without supplying values. Installation succeeded and reported:

```text
4 userConfig options not yet set (4 required)
```

The plugin inventory showed zero Skills and exactly one `ipzitalk-local` MCP server. Its four environment values remained `${user_config.KEY}` placeholders. No secret values were supplied or printed.

The CLI suggested either `/plugin configure` or `--config KEY=VALUE`. Ipzi Talk documentation permits only the configure UI for sensitive values because command arguments may be logged. Actual secure-storage masking, subprocess substitution, `/reload-plugins`, `/mcp`, OAuth, and local Code-tab behavior still require an authenticated interactive validation pass.

Both runtime payloads were installed together only in this isolated diagnostic config to inspect provenance. This is not a supported operating state; setup must report `conflict` and must not remove either automatically.

## Local server identity correction

The earlier `ipzitalk-local` MCP server name above records the original canary and is superseded by the unified contract. The runtime plugin remains `ipzitalk-local`, but its MCP server ID and npm package are now `presale-mcp`.

`claude plugin validate --strict plugins/ipzitalk-local` passed after the change. A fresh isolated Claude configuration installed the Local plugin without secret values and reported zero Skills plus exactly one MCP server named `presale-mcp`; all four required `userConfig` values remained unset.

## Authenticated user-profile CLI E2E

The current Claude Code `2.1.208` user profile initially contained only unrelated Telegram and Warp plugins. The local Ipzi Talk marketplace was added, then launcher `0.1.1` and Remote `0.1.2` were installed at user scope. Plugin inventory reported launcher Skills 1 / MCP 0 and Remote Skills 5 / MCP 1 (`ipzitalk`); the unrelated plugins remained enabled and unchanged.

A new non-interactive Claude Code process invoked `/ipzitalk:setup status only`. It derived a clean `Remote` state, confirmed that Local was absent, identified all five `ipzitalk-remote:*` Skills, and made no plugin, settings, credential, MCP, cache, or file changes.

The plugin MCP initially reported `Needs authentication`. The official `claude mcp login plugin:ipzitalk-remote:ipzitalk` browser flow completed, after which `claude mcp get` reported `Connected`. No authorization URL, redirect value, or credential is recorded here.

An allowlisted single-tool print session then called `mcp__plugin_ipzitalk-remote_ipzitalk__get_geocode` exactly once for 서울특별시 중구 세종대로 110. It returned the exact 서울시청 match at latitude `37.5666103`, longitude `126.9783882`, with legal-dong code `1114010300`. No web, shell, file, or second MCP tool was allowed.

An authenticated interactive Claude Code session then ran `/reload-plugins`. The command reported four plugins, zero newly reloaded Skills, six agents, six hooks, and two plugin MCP servers. Despite the reload summary's zero-Skill field, `/ipzitalk:setup status only` resolved to the installed launcher Skill and exposed its plugin base directory. The Skill requested one read-only `claude plugin list --json` command under the default approval policy; the one-time `Yes` option was selected, not the persistent allow option. It again derived `Remote`, confirmed Local was absent, reported the five packaged Remote Skills, and made no changes.

This completes the Claude Code CLI install, interactive reload, setup status, default-policy approval observation, OAuth, namespace, and representative Remote call gates. The remaining approval-policy matrix, sensitive Local `userConfig`, and Claude Code Desktop Code-tab checks remain incomplete. Claude Desktop was opened for the Code-tab pass, but the automation session had neither an attached in-app browser nor macOS Accessibility permission, so no Code-tab result is inferred from the CLI evidence.

The user then confirmed directly that Claude Desktop's Code tab does not expose `/reload-plugins`. This agrees with the official Desktop split: CLI uses slash commands, while the Code tab manages plugins through `+` → `Plugins`. Code-tab validation must therefore use the plugin manager UI followed by a new local session; the CLI reload result is not a Desktop test.

In that Code-tab plugin manager, the user observed `ipzitalk` with exactly the `setup` Skill and `ipzitalk-remote` with exactly five Skills; the unrelated Telegram plugin remained present. This verifies Desktop UI discovery and component separation, but not Skill invocation, MCP connection, OAuth reuse, or a Remote tool call. Those require a new local Code-tab session.

The user then opened a new local Code-tab session and invoked `ipzitalk:setup` with `status only`. The Skill listed the installed Claude plugins and returned `Remote`: launcher `0.1.1` and Remote `0.1.2` were installed and enabled at user scope, Local was absent, and no conflict existed. It described the hosted MCP and five Remote Skills and explicitly reported that the status-only run made no changes. This completes Desktop launcher discovery, Skill invocation, state inspection, and no-mutation verification; a Desktop Remote tool call is still required to prove MCP connection and OAuth reuse.
