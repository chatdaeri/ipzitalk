# Codex setup and lifecycle

This document describes the internal proof-of-concept flow. It is not a public release guide.

## Select a runtime

Run `$setup` in a new Codex process after installing the `ipzitalk` launcher. The setup Skill explains both modes and waits for an explicit choice before changing plugins.

- **Remote** — hosted data, OAuth, eleven Remote tools, and five Remote Skills.
- **OSS** — local Node.js process, ten tools, four user-supplied API keys, and no Skills.

Only one of `ipzitalk-remote@ipzitalk` and `ipzitalk-local@ipzitalk` is supported at a time. If both are present, setup stops without removing either. Runtime status comes only from `codex plugin list --json`.

## Remote

The approved install command is:

```bash
codex plugin add ipzitalk-remote@ipzitalk --json
```

After installation, start a new Codex process and use `codex mcp login ipzitalk` if OAuth has not started automatically. A cancelled login may be resumed with the same command. Verify the server URL and authentication status with `codex mcp list --json`; never copy stored OAuth material into diagnostics.

## OSS

OSS requires Node.js 18 or later and `npx`. Export the four API keys in the environment that launches Codex CLI. Check only whether each name is set; do not print values.

```bash
codex plugin add ipzitalk-local@ipzitalk --json
```

The payload forwards the variable names through `env_vars` to `npx -y presale-mcp@0.1.0`. The package is not yet available from the registry in this phase, so registry-backed runtime installation remains incomplete until publication. Tarball testing must use an untracked temporary manifest and must not leave local paths in committed files.

Codex Desktop OSS is unsupported in this proof of concept because safe secret delivery from a Finder/Dock launch has not been verified.

## Switch

Switching is always remove, then add, then new process, then verify. Each remove and add is a separate approved operation.

```bash
codex plugin remove ipzitalk-remote@ipzitalk --json
codex plugin add ipzitalk-local@ipzitalk --json
```

Use the reverse pair for OSS to Remote. If removal fails or is declined, do not add the other payload. If addition fails, report `not installed` and offer the previous payload's add command as a separate recovery action.

## Update

Update the repository marketplace through Codex plugin commands, then reinstall only the exact managed plugin that needs refreshing. Start a new process and re-run plugin/MCP status checks. Do not edit `~/.codex/config.toml`, marketplace files, or plugin caches by hand.

The current Skill lock is `local-only`. Before any public beta, replace it with a reachable release commit and re-run the sync and package validators.

## Complete removal

Remove the selected runtime first and the launcher second, with separate approvals:

```bash
codex plugin remove ipzitalk-remote@ipzitalk --json
codex plugin remove ipzitalk@ipzitalk --json
```

Substitute `ipzitalk-local` when OSS is selected. Never remove an unrelated plugin or a manually configured MCP server.
