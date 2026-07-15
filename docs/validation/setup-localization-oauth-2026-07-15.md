# Setup localization and OAuth validation — 2026-07-15

## Scope

This change localizes the launcher-controlled installation experience and defines a platform-native Remote authentication handoff. It does not modify the hosted MCP server, OAuth protocol, user credentials, or marketplace client implementation.

Plugin versions for this validation candidate are launcher `0.1.2`, Remote `0.1.16`, and Local `0.1.2`.

## Korean UI contract

The setup Skill presents these choices before mutation:

- `Remote(호스팅형·권장)`
- `OSS(로컬 실행)`
- `상태만 확인`

Codex launcher, Remote, and Local manifest descriptions and default prompts are Korean. Claude marketplace descriptions and Local sensitive-field titles and descriptions are also Korean. Client-owned command names, generic buttons, and shell approval chrome may still follow the client locale; the plugin cannot override those strings.

## Remote browser authentication contract

- Codex CLI uses `codex mcp login ipzitalk` after a Korean `브라우저에서 로그인 시작` approval.
- Claude Code CLI reloads plugins and uses `claude mcp login plugin:ipzitalk-remote:ipzitalk` after the same approval.
- Codex Desktop and Claude Desktop local Code sessions use their native connect/login prompt or the first Remote Skill call after opening a new local session.
- Setup never constructs, prints, stores, or documents an authorization URL, authorization code, or token.
- Authentication success is verified from MCP state and a representative Remote call rather than inferred from a browser launch.

## Automated contract

`node scripts/validate-package.mjs` checks the three Korean choices, 27-Skill wording, official login commands, OAuth-material prohibition, Korean manifests and prompts, Korean Claude Local sensitive-field labels, and matching package versions.

Completed evidence:

- `node scripts/validate-package.mjs`: passed.
- `claude plugin validate --strict .`: passed.
- `claude plugin validate --strict plugins/ipzitalk`: passed.
- `claude plugin validate --strict plugins/ipzitalk-remote`: passed.
- `claude plugin validate --strict plugins/ipzitalk-local`: passed.
- An isolated Codex profile installed launcher `0.1.2`, listed it as enabled with `ON_USE`, and contained the Korean setup choices and browser-login instruction in its installed cache.
- An isolated Claude profile installed launcher `0.1.2`, listed it as enabled, and contained the same Korean setup contract in its installed cache.

The `skill-creator` and `plugin-creator` Python compatibility validators could not start because the existing Python environment does not contain PyYAML. No dependency was installed. This is an environment-level validation gap, not a passed check.

## Interactive checks still required

Run each test in a new session after installing the candidate packages. Record only pass/fail and non-sensitive status; do not capture authorization URLs or credentials.

1. Codex CLI: Korean choice → Remote install approval → browser-login approval → system browser → successful MCP status → representative Remote call.
2. Claude Code CLI: Korean choice → Remote install approval → `/reload-plugins` → browser-login approval → system browser → `/mcp` connected state → representative Remote call.
3. Codex Desktop: Korean plugin card and setup choices → new local session → native login prompt → representative Remote call.
4. Claude Desktop local Code tab: Korean marketplace/plugin description and setup choices → new local session → native login prompt → representative Remote call.
5. Claude Local configure UI: four Korean sensitive-field labels, masked input, and no secret value in chat or command arguments.

An already authenticated profile may reuse its stored session and show no browser. To test first-login behavior, use an approved isolated profile rather than deleting the user's active credentials.
