# Codex canary validation — 2026-07-14

## Environment

- Codex CLI: `codex-cli 0.144.3`
- Node.js: `v26.3.1`
- Repository branch: `feat/plugin-codex-poc`
- Launcher plugin: `ipzitalk@ipzitalk` version `0.1.0`
- Runtime plugin: `ipzitalk-remote@ipzitalk` version `0.1.0`

## Package validation

`node scripts/validate-package.mjs` passed. The validator checks marketplace paths and policies, launcher/runtime separation, the exact Remote MCP URL, source-lock invariants, and forbidden local paths, legacy domains, placeholders, and likely secret material.

`git diff --check` passed, and the package scan found no `/Users/` path, legacy `mcp.synergylabs.kr` URL, `TODO`, or embedded secret candidate in distributable files.

The bundled plugin validator could not run because neither available Python interpreter includes PyYAML (`ModuleNotFoundError: No module named 'yaml'`). No dependency was installed for this canary. The inspected validator was:

- `/Users/synergylabs/.codex/skills/.system/plugin-creator/scripts/validate_plugin.py`
- SHA-256: `ebda00d55d7518b127f675f062fb5c6e7a1ffdc0a99df1a55ac594400d7d3228`

## Marketplace and install canary

The repository marketplace loaded in an isolated `CODEX_HOME` and in the authenticated user profile. Both payloads installed from the repository marketplace without editing Codex configuration or plugin caches:

```text
codex plugin marketplace add /Users/synergylabs/Documents/GitHub/ipzitalk --json
codex plugin add ipzitalk@ipzitalk --json
codex plugin add ipzitalk-remote@ipzitalk --json
```

The authenticated profile resolved the installed source to this repository and reported both plugins as installed and enabled. A newly started Codex process was used for runtime verification; the canary does not claim hot loading into an already-running thread.

## Setup skill canary

The first repository-local run used `$setup status only` and loaded `plugins/ipzitalk/skills/setup/SKILL.md`, but that run alone did not prove the installed plugin namespace because the repository was the working directory. Phase 2B then verified the prefixed identifier with an authenticated run of `$ipzitalk:setup status only`. It executed `codex plugin list --json`, made no file or plugin changes, and derived:

```text
Remote
ipzitalk-remote@ipzitalk: installed and enabled
ipzitalk-local: not installed
conflict: none
```

`policy.allow_implicit_invocation: false` intentionally keeps the setup skill out of implicit model selection. `$ipzitalk:setup` is the verified explicit identifier. In an isolated profile, Remote Skills were exposed with the `ipzitalk-remote:<skill-name>` prefix.

## Remote MCP canary

Before login, `codex mcp list --json` reported:

```text
name: ipzitalk
transport: streamable_http
url: https://ipzi-talk.synergylabs.kr/mcp
auth_status: not_logged_in
```

`codex mcp login ipzitalk` completed the OAuth authorization-code flow with PKCE. After login the status was `o_auth`.

An authenticated Codex run called one representative tool exactly once. The structured event identified the source and tool without ambiguity:

```text
server: ipzitalk
tool: get_geocode
arguments.address: 서울특별시 중구 세종대로 110
status: completed
```

The result resolved 서울특별시청 at latitude `37.5666103`, longitude `126.9783882`, with legal-dong code `1114010300` and confidence `exact`. This validates marketplace loading, OAuth, MCP transport, tool provenance, and a real Remote tool call end to end.

## Canary scope

This checkpoint contains only the launcher and Remote MCP payload. The Remote skill payload, OSS runtime payload, Claude package, security changes, npm publication work, and beta workflow remain outside this checkpoint.
