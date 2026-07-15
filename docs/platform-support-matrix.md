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
| Codex CLI | Validated | Conditional | `$ipzitalk:setup` and plugin-prefixed Remote Skills | Start a new Codex process | Remote OAuth, MCP canary, six-Skill discovery, and representative reports have been exercised. OSS registry publication remains incomplete. |
| Codex Desktop local workspace | Pending `0.1.11` regression | Out of scope for OSS | Use the Desktop Skill picker in a new local workspace | Start a new local workspace/session | Earlier Remote payloads produced representative artifacts. The current `0.1.11` filename and report regressions still need a Desktop run. Finder/Dock secret delivery for OSS is unverified. |
| Claude Code CLI | Validated for Remote | Pending | `/ipzitalk:setup`, `/ipzitalk-remote:<skill>`, `/mcp` | `/reload-plugins` | Launcher, Remote status, OAuth reuse, and representative Remote calls were observed. OSS awaits registry-backed installation. |
| Claude Desktop local Code tab | Validated through Remote `0.1.10`; `0.1.11` pending | Pending in a separate profile | `+` → `Plugins` → `ipzitalk` or `ipzitalk-remote` | Open a new local session | The Code tab has no `/reload-plugins`. Raw CLI namespace strings can be rejected as CLI-only. `0.1.11` Location, Overview, and Presale regressions remain interactive checks. |
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
- Remote packages six Skills during the internal proof of concept.
- A Remote Skill must use tools whose plugin/server provenance resolves to `ipzitalk-remote` / `ipzitalk`.
- If Remote and Local expose the same base tool name and provenance is ambiguous, stop instead of falling back to Local.
- The current Claude user profile has Remote `0.1.11`; its Location Report, Complex Overview All, and Presale Report regressions still require new-session Desktop evidence.

## OSS boundary

- OSS is MCP-only: ten tools and zero Skills.
- The runtime plugin ID is `ipzitalk-local`; the MCP server ID and package name are `presale-mcp`.
- `presale-mcp@0.1.0` is not yet registry-verified, so committed registry-backed manifests are not complete runtime evidence.
- Codex Desktop OSS is unsupported until a safe secret-delivery path from Finder/Dock launch is proven.
- Claude OSS testing must use a separate profile or an explicitly approved maintenance window because switching removes the currently active Remote payload.
- Sensitive values belong only in the supported environment or configure UI. Never paste them into chat, command arguments, manifests, logs, or documentation.

## Current interactive regression gate

Remote `0.1.11` is installed in the Claude user profile. A new local Code tab session must verify:

1. `ipzitalk-location-report`: numeric distance headers align with values and the user artifact uses `<target>_입지보고서.html`.
2. `ipzitalk-complex-overview-all`: the user artifact uses `<complex>_한눈에보기.html`, while the 12 confirmed months, 23-call budget, and audit ledger remain intact.
3. `ipzitalk-presale-report`: past move-in dates are not described as future inventory, zero recent announcements do not imply market maturity, and the region/complex filename rule is applied.

The release lock cannot be finalized until the Skill security and namespace work is merged into a reachable source commit. Push, pull request, publication, merge, and deployment remain separate approval gates.
