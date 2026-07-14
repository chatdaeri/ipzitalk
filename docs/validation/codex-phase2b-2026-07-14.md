# Codex Phase 2B validation — 2026-07-14

## Local-only source lock

Phase 2B proceeded without a pull request by locking the local `ipzitalk-skill` commit `24ac99f5c3756ed6be4685eaec89260c74e4e323`. The lock is explicitly marked `local-only`; it is not suitable for a public beta or another machine until replaced by a reachable release commit.

`scripts/sync-skills.mjs` verified the source HEAD and per-skill Git diff, copied the five allowlisted main Skills, and compared source/target file paths and SHA-256 hashes. `scripts/validate-package.mjs` then passed.

## Remote payload

An isolated Codex profile installed `ipzitalk-remote@ipzitalk`. `codex debug prompt-input` exposed exactly these plugin-prefixed Skills:

- `ipzitalk-remote:ipzitalk-complex-overview-all`
- `ipzitalk-remote:ipzitalk-location-report`
- `ipzitalk-remote:ipzitalk-presale-report`
- `ipzitalk-remote:ipzitalk-read-notice-compare`
- `ipzitalk-remote:ipzitalk-read-notice-report`

An authenticated run verified `$ipzitalk:setup status only` as the launcher identifier and derived `Remote` without changing plugins or files.

The authenticated Remote MCP call from Phase 2A remains valid: `server=ipzitalk`, `tool=get_geocode`, status `completed`.

## OSS payload manifest

An isolated Codex profile installed `ipzitalk-local@ipzitalk`. `codex mcp list --json` loaded:

```text
transport: stdio
command: npx
args: -y presale-mcp@0.1.0
env_vars: KAKAO_REST_API_KEY, NAVER_MAPS_CLIENT_ID,
          NAVER_MAPS_CLIENT_SECRET, DATA_GO_KR_SERVICE_KEY
```

No environment values were embedded or printed. The OSS payload contains zero Skills. Codex Desktop OSS remains unsupported until a safe Finder/Dock secret-delivery path is verified.

## OSS tarball

At `presale-mcp-oss` commit `dce19f9b829af9bc14980ff3d55093065d533908`:

- `npm run typecheck` passed.
- `npm test` passed: 18 files, 149 tests.
- `npm run build` passed.
- `npm pack` produced an untracked `presale-mcp-0.1.0.tgz` under `/tmp` with four files.
- An MCP SDK client started the tarball and listed exactly ten expected tools.

The API-key-missing call exposed a blocker. `get_geocode` returned an error object with `isError`, but also returned `structuredContent`. The MCP SDK validated that error object against the success output schema and raised `-32602` because required success fields such as `lat` and `lng` were absent.

After explicit approval, `presale-mcp-oss` added a RED regression test at commit `40ea84a` and changed `jsonToolResult` to omit `structuredContent` when `isError` is true at commit `adacd5d2f40e64c9f87cd35f7017e07929acd2bd`.

The targeted test passed, and the full gates again passed: typecheck, 18 test files/149 tests, and build. A newly packed tarball then passed the real MCP SDK check: ten tools were listed, and `get_geocode` returned a normal `isError=true` API-key-missing result that named the required environment variable without exposing a value. The local MCP lock is marked `local-only` until this fix is available from a reachable release commit.

## Payload lifecycle

A fresh isolated `CODEX_HOME` installed the launcher and Remote payload, then intentionally installed OSS to create a diagnostic conflict. Codex listed both runtime plugins as installed and enabled and exposed both MCP servers; the platform does not prevent this unsupported state. Setup therefore must derive `conflict` and stop without removing either payload automatically.

The same profile verified both switch directions with explicit state checks:

- Remote removal left only OSS and `ipzitalk-local`.
- OSS removal followed by Remote installation left only Remote and `ipzitalk`.
- Removing the launcher left the Remote runtime and MCP server installed.

Codex returned a successful JSON result when asked to remove an OSS plugin that was already absent. The lifecycle contract now requires a follow-up `codex plugin list --json` check; remove exit status alone is not accepted as evidence that the old payload was present or removed.

## Skill provenance isolation

`codex debug prompt-input` in the fresh isolated profile exposed exactly the five `ipzitalk-remote:<skill-name>` entries from the plugin cache. The current user profile exposed global Skills with the same five base names while the installed Remote payload's prefixed Skills were absent from the rendered prompt, consistent with a stale `0.1.0` canary cache or duplicate-source collision.

No user profile, global Skill, plugin cache, or Codex configuration was modified. Setup now stops before Skill-driven work when an expected plugin-prefixed Skill is missing or a same-base global Skill is also exposed. Resolution requires an explicit user-managed cleanup or a clean profile; setup never deletes the global copy automatically.

## Local secret boundary

Node.js `v26.3.1` and npm/npx `11.16.0` were available. All four required OSS environment-variable names were missing in the verification process. No value was requested, printed, or written, so an external-API success call was not attempted. The fixed local tarball's ten-tool listing and API-key-missing error regression remain the completed secret-free checks; Codex Desktop OSS remains unsupported and registry-backed runtime verification remains Phase 4 work.

## Local server identity correction

Claude's repository audit found that the Local runtime plugin ID `ipzitalk-local` had also been used as the MCP server key even though the plan and source lock identify the executable package as `presale-mcp`. The contract now separates those identities: plugin state uses `ipzitalk-local`, while MCP state and the npm package use `presale-mcp`.

The package validator first failed against the old key, then passed after both Codex and Claude manifests changed to `presale-mcp`. A new isolated Codex profile installed `ipzitalk-local@ipzitalk`; `codex mcp list --json` exposed exactly one `presale-mcp` stdio server with the registry command and four environment-variable names. No `ipzitalk-local` MCP server key remained and no secret value was supplied or printed.

## User-profile cache refresh

After the server identity correction passed, all three plugin manifests advanced from `0.1.0` to `0.1.1`; the unpublished npm command remains `presale-mcp@0.1.0`. The current user profile removed Remote, verified its absence, removed the launcher, verified that no Ipzi Talk plugin remained, and then installed launcher `0.1.1` followed by Remote `0.1.1`. No unrelated plugin or MCP server was changed.

The refreshed profile preserved the hosted `ipzitalk` MCP with `auth_status: o_auth`. A new `codex debug prompt-input` exposed all five expected `ipzitalk-remote:<skill-name>` entries from the `0.1.1` plugin cache. It also exposed the same five base names from the existing global Skill source.

An actual `$ipzitalk:setup status only` run made no changes and returned the expected safe verdict: runtime state `Remote` with `skill provenance conflict`; Skill-driven work must stop until the duplicate global source is resolved explicitly. Setup did not remove or rewrite the global Skills, plugin cache, MCP configuration, or files.
