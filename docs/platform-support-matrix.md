# Platform support matrix

This document records observed proof-of-concept behavior. It separates verified behavior from planned behavior and does not turn an internal test into a public support commitment.

## Status definitions

- **Validated** — the stated flow has direct CLI, Desktop, or artifact evidence.
- **Conditional** — part of the flow works, but a named release or security gate remains.
- **Pending** — implementation may exist, but the required end-to-end verification is incomplete.
- **Out of scope** — this repository does not claim that product surface as supported.

## Runtime matrix

| Product surface | Remote runtime | OSS runtime | Skill invocation | Apply changes | Evidence boundary |
|---|---|---|---|---|---|
| Codex CLI | Validated for Remote `0.1.16` and 27-Skill discovery | Conditional | `$ipzitalk:setup` and plugin-prefixed Remote Skills | Start a new Codex process | Remote installation, OAuth, 27 Skills, representative calls, and authentication reuse were observed in an independent terminal. OSS registry smoke passed; actual API-key calls and switching remain. |
| Codex Desktop local workspace | Deferred by team decision | Out of scope for OSS | Use the Desktop Skill picker in a new local workspace | Start a new local workspace/session | CLI evidence is not promoted to Desktop evidence. Finder/Dock secret delivery for OSS is unverified. |
| Claude Code CLI | Validated for Remote `0.1.16` | Validated for Local `0.1.2` / `presale-mcp@0.1.0` | `/ipzitalk:setup`, `/ipzitalk-remote:<skill>`, `/mcp` | `/reload-plugins` for plugin changes; new process after external OAuth login | Korean setup, Remote representative calls and OAuth reuse were observed. A first-login test showed that an already running process may retain pre-login MCP auth state, while a new process using the same profile connects successfully. A separate profile entered four sensitive values through configure UI, exercised Kakao/Naver/public-data Local calls, and passed Remote→OSS→Remote recovery without simultaneous payloads. |
| Claude Desktop local Code tab | Validated for Remote `0.1.16` | Pending in a separate profile | `+` → `Plugins` → `ipzitalk` or `ipzitalk-remote` | Open a new local session | Installation, a new local Code session, Remote use, and authentication reuse without another login were observed. The Code tab has no `/reload-plugins`. |
| Claude Desktop Chat | Out of scope | Out of scope | Not defined | Not defined | This is not the local Claude Code plugin surface. |
| Claude Desktop Cowork | Out of scope | Out of scope | Not defined | Not defined | This is not the local Claude Code plugin surface. |
| Claude remote/web session | Out of scope | Out of scope | Not defined | Not defined | The current package is tested only in local Claude Code sessions. |

## Commands are platform-specific

Codex and Claude use different plugin command systems. This difference is inherent to the two products and is unrelated to whether the repository is private or public.

| Action | Codex | Claude Code CLI | Claude Desktop local Code tab |
|---|---|---|---|
| Invoke launcher | `$ipzitalk:setup` | `/ipzitalk:setup` | `+` → `Plugins` → `ipzitalk` → `setup` |
| Invoke Remote Skill | Plugin-prefixed Skill picker or `$` invocation | `/ipzitalk-remote:<skill>` | `+` → `Plugins` → `ipzitalk-remote` → Skill |
| Reload/apply | Start a new process | `/reload-plugins` | Open a new local session; `/reload-plugins` is unavailable |
| Inspect MCP | `codex mcp list --json` | `/mcp` | Confirm through the local Code session and representative call |

Do not document a raw Desktop slash command merely because the equivalent CLI command exists. Record only identifiers observed on that surface.

## Remote boundary

- Remote uses the hosted `ipzitalk` MCP server and OAuth.
- Remote packages 27 Skills (main 6 + sub 21) in the private release.
- A Remote Skill must use tools whose plugin/server provenance resolves to `ipzitalk-remote` / `ipzitalk`.
- If Remote and Local expose the same base tool name and provenance is ambiguous, stop instead of falling back to Local.
- Remote `0.1.16` was verified in Claude Code CLI, Claude Desktop local Code, and Codex CLI. Codex Desktop remains deferred by team decision.

## OSS boundary

- OSS is MCP-only: ten tools and zero Skills.
- The runtime plugin ID is `ipzitalk-local`; the MCP server ID and package name are `presale-mcp`.
- `presale-mcp@0.1.0` is published and clean-cache registry verification exposed exactly ten tools and a valid missing-key error response without `structuredContent`.
- Codex Desktop OSS is unsupported until a safe secret-delivery path from Finder/Dock launch is proven.
- Claude OSS testing must use a separate profile or an explicitly approved maintenance window because switching removes the currently active Remote payload.
- Sensitive values belong only in the supported environment or configure UI. Never paste them into chat, command arguments, manifests, logs, or documentation.

## Completed Claude CLI interactive regression

Claude Code CLI completed the Local OSS regression in a separate profile:

1. Install launcher `0.1.5` and `ipzitalk-local` while confirming Remote is absent.
2. Enter four API keys only through the supported environment or Claude sensitive configuration UI.
3. Verify ten Local tools and representative real API calls without exposing values.
4. Remove Local, reinstall Remote, and confirm OAuth reuse plus a representative Remote call.

The first configure attempt before plugin reload failed as not installed; the verified order is install, `/reload-plugins`, configure, `/reload-plugins`, then `/mcp` and representative calls. Remote reinstall reused the existing OAuth session without another browser login. After `/clear`, the client enumerated the expected 27 Remote Skill names. Its summary label incorrectly said 30, but the category counts and listed names total exactly 27; this is recorded as a response counting error, not a package inventory mismatch.

Codex Desktop remains deferred. Pull request, tag, and public-beta transitions remain separate approval gates.
