# Public beta install, removal, and recovery checklist — 2026-07-16

## Purpose and scope

This document is the release-gate checklist for installing, removing, switching, and recovering the Ipzi Talk launcher and runtime payloads before a public beta. It records observed behavior separately from pending product-surface work. It does not authorize a marketplace publication, repository visibility change, tag, merge, or deployment.

Package baseline:

- launcher candidate: `ipzitalk@ipzitalk` `0.1.5`
- hosted runtime: `ipzitalk-remote@ipzitalk` `0.1.16`
- local runtime: `ipzitalk-local@ipzitalk` `0.1.2`
- npm runtime: `presale-mcp@0.1.0`
- Remote inventory: 27 Skills and 11 hosted MCP tools
- Local inventory: zero Skills and 10 MCP tools

Status terms:

- **PASS** — direct interactive or artifact evidence exists.
- **CONDITIONAL** — the verified flow works within the stated boundary.
- **DEFERRED** — the team intentionally postponed the product surface.
- **APPROVAL REQUIRED** — implementation or verification must not proceed without an explicit user decision.

## Release invariant

- [x] Exactly one managed runtime payload is active: Remote or Local, never both.
- [x] The launcher is not counted as a runtime payload.
- [x] Runtime removal is verified from the plugin list before the other runtime is installed.
- [x] A successful install command is followed by an actual plugin/MCP inventory check.
- [x] Authentication success is verified through MCP state and a representative call, never inferred from a browser opening.
- [x] API keys, OAuth URLs, callbacks, authorization codes, state values, tokens, and client secrets are not copied into chat, logs, manifests, or documents.
- [x] README files remain outside this change because a teammate owns them.

## Claude Code CLI

### Launcher and Remote installation

- [x] Add or update the `ipzitalk` marketplace and install the launcher in user scope.
- [x] Apply the launcher with `/reload-plugins` before invoking `/ipzitalk:setup`.
- [x] Present the three Korean choices: `Remote(호스팅형·권장)`, `OSS(로컬 실행)`, and `상태만 확인`.
- [x] Installing Remote does not continue into login in the same setup run.
- [x] After Remote installation, run `/reload-plugins` and invoke setup again.
- [x] Confirm Remote is the only runtime payload and that 27 Remote Skills are present.

### First Remote OAuth

- [x] If a representative Remote call is already authenticated, reuse the existing OAuth session and do not force another browser login.
- [x] If unauthenticated, run `claude mcp login plugin:ipzitalk-remote:ipzitalk` in an external interactive terminal.
- [x] Do not treat a model shell or chat `!` command as a supported interactive OAuth completion path.
- [x] Let the official client open the system browser and receive the localhost callback.
- [x] After login succeeds, completely exit the Claude Code process that was already running.
- [x] Start a new Claude Code process with the same profile. If `CLAUDE_CONFIG_DIR` was used, use the same value for login and the new process.
- [x] Do not claim that `/reload-plugins` alone refreshes OAuth state in an already-running process.
- [x] In the new process, verify setup state, `/mcp`, and one representative Remote call.

Observed result: **PASS**. A previously unauthenticated computer completed browser OAuth in an external terminal. The already-running Claude process did not always observe the credential after reload, while a new process using the same profile connected successfully. Launcher `0.1.5` records this process boundary; the Remote MCP and OAuth protocol did not change.

### Remote to Local

- [x] Confirm Node.js 18 or later and `npx` before changing payloads.
- [x] Remove `ipzitalk-remote@ipzitalk` only after a separate approval.
- [x] Re-read the plugin list and stop if Remote is still present.
- [x] Install `ipzitalk-local@ipzitalk` only after a separate approval.
- [x] Confirm Local is the only runtime payload.
- [x] Run `/reload-plugins` before `/plugin configure ipzitalk-local@ipzitalk`.
- [x] Enter the four required values only through sensitive `userConfig` fields.
- [x] Run `/reload-plugins` again after saving configuration.
- [x] Confirm `presale-mcp` through `/mcp` and representative calls.
- [x] Confirm exactly 10 Local tools and zero Local Skills.

Observed result: **PASS**. Kakao, Naver, and public-data representative paths were exercised without exposing values. Configure before the first reload returned `not installed in this project`; the verified order above is mandatory guidance.

### Local to Remote recovery

- [x] Remove `ipzitalk-local@ipzitalk` only after a separate approval.
- [x] Re-read the plugin list and stop if Local is still present.
- [x] Install `ipzitalk-remote@ipzitalk` only after a separate approval.
- [x] Run `/reload-plugins`, invoke setup again, and check authentication before proposing login.
- [x] Confirm OAuth reuse when available instead of requiring a new browser login.
- [x] Confirm exactly one Remote runtime, Local absent, 27 Remote Skills, and a representative hosted call.

Observed result: **PASS**. The final Remote recovery reused the existing OAuth session and completed a representative hosted call without another login.

### Complete removal and failure recovery

- [x] Complete removal order is active runtime first, launcher second, then `/reload-plugins`.
- [x] If runtime removal fails or is declined, do not install the other runtime.
- [x] If installation fails, report the runtime as not installed and offer the previous runtime installation as a separate action.
- [x] Do not edit credential storage, plugin cache, marketplace files, or Claude settings by hand as a recovery shortcut.
- [x] An expired login is recovered only with the official login command and a new same-profile Claude process.

## Claude Desktop local Code tab

- [x] Launcher and Remote installation are visible through `+` → `Plugins`.
- [x] A new local Code session can invoke Remote and reuse an existing OAuth session.
- [x] The Code tab is documented without a nonexistent `/reload-plugins` command.
- [ ] First-time unauthenticated browser OAuth in the Desktop Code tab is not separately promoted to PASS by the CLI result.
- [ ] Local sensitive configuration and Remote↔Local switching in the Desktop Code tab remain pending in a separate profile.

Status: **CONDITIONAL** for Remote; Local remains pending. Claude Desktop Chat, Cowork, and remote/web sessions are outside this plugin support claim.

## Codex

- [x] Codex CLI Remote installation, 27-Skill discovery, OAuth, representative calls, and authentication reuse were observed in an independent terminal.
- [x] The installed marketplace and plugin state must use the same `CODEX_HOME`; an Orca-managed isolated runtime is not treated as an interchangeable profile.
- [ ] Codex CLI Local API-key calls and bidirectional switching are not promoted to PASS by Claude CLI evidence.
- [ ] Codex Desktop remains deferred by team decision.

Status: **CONDITIONAL**. The public beta support statement must not imply Codex Desktop or Codex Local validation that has not been performed.

## Artifact and package checks

- [x] `node scripts/validate-package.mjs` passes.
- [x] `claude plugin validate --strict .` passes.
- [x] `claude plugin validate --strict plugins/ipzitalk` passes.
- [x] `claude plugin validate --strict plugins/ipzitalk-remote` passes.
- [x] `claude plugin validate --strict plugins/ipzitalk-local` passes.
- [x] Remote Skill count is 27; Remote HTML template count is 26; Local Skill count is zero.
- [x] Plugin and marketplace roots contain no symbolic links.
- [x] Validated package/document scope contains no secret patterns or personal absolute paths.
- [x] Fresh isolated Codex and Claude profiles install launcher `0.1.5` without installing either runtime as a side effect.
- [x] README files are unchanged in the launcher `0.1.5` candidate.
- [ ] The optional Python compatibility validators were not run because PyYAML is unavailable; no dependency was installed merely for this check.

## Public beta decision gate

Installation, switching, and recovery readiness for the currently supported Claude Code CLI path: **PASS**.

The following remain before public marketplace, tag, or repository visibility changes:

- [ ] Review Privacy, Terms, License, third-party notices, logos, icons, dark assets, and representative screenshots.
- [ ] Decide the exact public support boundary for Codex CLI Local, Codex Desktop, and Claude Desktop Local.
- [ ] Decide whether OAuth cancellation/retry needs a separate isolated-profile release gate.
- [ ] Obtain explicit user approval for the launcher `0.1.5` commit, push, and pull request.
- [ ] Obtain explicit user approval before public marketplace publication, tag creation, or repository visibility change.

## Evidence

- `docs/claude-setup.md`
- `docs/platform-support-matrix.md`
- `docs/validation/setup-localization-oauth-2026-07-15.md`
- `docs/validation/oss-registry-0.1.0-2026-07-16.md`
- `docs/validation/oss-prepublish-2026-07-16.md`
