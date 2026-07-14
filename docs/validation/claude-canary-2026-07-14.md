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
