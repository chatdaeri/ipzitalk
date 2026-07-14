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

The existing `tests/tool-result.test.ts` explicitly expects structured error objects to be retained. Changing that behavior would require updating an existing test that currently serves as specification, so implementation stopped pending explicit approval rather than silently changing the test.
