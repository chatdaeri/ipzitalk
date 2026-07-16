# Setup localization and OAuth validation — 2026-07-15

## Scope

This change localizes the launcher-controlled installation experience and defines a platform-native Remote authentication handoff. It does not modify the hosted MCP server, OAuth protocol, user credentials, or marketplace client implementation.

The original localization candidate used launcher `0.1.2`, Remote `0.1.16`, and Local `0.1.2`. Registry and switching follow-up produced launcher `0.1.4`; the first-login new-process guidance produces launcher `0.1.5`. Remote remains `0.1.16` and Local remains `0.1.2`.

## Korean UI contract

The setup Skill presents these choices before mutation:

- `Remote(호스팅형·권장)`
- `OSS(로컬 실행)`
- `상태만 확인`

Codex launcher, Remote, and Local manifest descriptions and default prompts are Korean. Claude marketplace descriptions and Local sensitive-field titles and descriptions are also Korean. Client-owned command names, generic buttons, and shell approval chrome may still follow the client locale; the plugin cannot override those strings.

## Remote browser authentication contract

- Codex CLI uses `codex mcp login ipzitalk` after a Korean `브라우저에서 로그인 시작` approval.
- Claude Code CLI reloads plugins first. If it remains unauthenticated, the user runs `claude mcp login plugin:ipzitalk-remote:ipzitalk` in an external interactive terminal so the browser and localhost callback can complete.
- Codex Desktop and Claude Desktop local Code sessions use their native connect/login prompt or the first Remote Skill call after opening a new local session.
- Setup never constructs, prints, stores, or documents an authorization URL, authorization code, or token.
- Authentication success is verified from MCP state and a representative Remote call rather than inferred from a browser launch.
- A non-interactive model shell or chat `!` execution is not treated as a supported OAuth completion path. It must not ask the user to paste a callback URL, authorization code, or state into chat.

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

## Interactive validation results — 2026-07-16

Decision: 류호윤 + Codex

| Surface | Result | Evidence |
|---|---|---|
| Codex CLI | PASS | An independent terminal installed launcher `0.1.2` and Remote `0.1.16`, exposed 27 Remote Skills, kept Local uninstalled, completed official OAuth, and reused authentication in a new session. |
| Claude Code CLI | PASS | The Korean setup flow, Remote installation, official browser OAuth, 27 Remote Skills, representative Remote use, and authentication reuse in another session were confirmed. |
| Claude Desktop local Code tab | PASS | Installation through `+` → `Plugins`, Remote use in a new local Code session, and authentication reuse without another login were confirmed. Local was not selected. |
| Codex Desktop | DEFERRED | The team deferred this surface. Its installation and authentication behavior is not promoted to PASS by the CLI result. |

The Codex CLI test also identified a host-specific limitation: installation initiated from an Orca-managed runtime can target its isolated `CODEX_HOME` and fail to persist registration across terminal tabs. The supported evidence above comes from an independent terminal such as Warp, iTerm2, or Terminal.app. This is not treated as a Remote plugin package defect.

No authorization URL, authorization code, token, API key, or other credential was recorded. Existing authentication reuse is a valid PASS condition; a browser not reopening in an already authenticated profile is not a failure.

### Local OSS and switching follow-up — 2026-07-16

An isolated Claude Code CLI profile completed Local `presale-mcp@0.1.0` configuration through four sensitive UI fields and exercised Kakao, Naver, and public-data paths without exposing values. Remote→OSS→Remote switching kept only one runtime payload active and the final Remote reinstall reused the existing OAuth session without another browser login.

After the final Remote recovery and `/clear`, the client listed all expected 27 Remote Skill names. The generated heading said `총 30개`, but the names shown across all categories count to 27 exactly. Package discovery therefore passes; only the assistant's arithmetic summary was incorrect.

The verified Local order is installation → `/reload-plugins` → `/plugin configure ipzitalk-local@ipzitalk` → `/reload-plugins`. Configure before the first reload returned `not installed in this project`.

The first-login experiment also showed that invoking the official Claude login command from the model's non-interactive shell cannot reliably complete the browser callback. The setup contract therefore ends after installation/reload guidance and proposes login only on a later setup run when authentication is still absent. First login uses an external interactive terminal; no callback URL or one-time authorization material is copied into chat.

### Launcher 0.1.4 isolated installation — 2026-07-16

Fresh temporary Codex and Claude profiles installed only `ipzitalk@ipzitalk` `0.1.4`. Both installed caches contained the updated setup contract:

- stop after install and require process reload/application before offering login;
- use an external interactive terminal when the model shell cannot provide a TTY;
- never ask the user to paste callback URL, authorization code, or state into chat;
- use `install → /reload-plugins → configure → /reload-plugins` for Claude Local;
- verify OAuth reuse instead of claiming plugin removal always deletes credentials.

Neither isolated profile installed Remote or Local as a side effect. This is a cache/package contract check; browser OAuth and real Local calls are covered by the preceding interactive evidence.

### Launcher 0.1.5 first-login process boundary — 2026-07-16

On a different computer with no active Ipzi Talk MCP authorization in the running Claude session, OAuth completed successfully in an external interactive terminal. Returning to the already-running Claude Code process and using `/reload-plugins` did not always make that process observe the new credential. Starting a new Claude Code process with the same profile connected successfully.

Launcher `0.1.5` therefore distinguishes plugin application from credential application: `/reload-plugins` remains the plugin-install step, while successful external OAuth login is followed by completely exiting the old Claude Code process and starting a new process with the same `CLAUDE_CONFIG_DIR` when one is used. This is guidance-only; no OAuth server, Remote MCP, or credential storage code changed.

Fresh temporary Codex and Claude profiles installed only launcher `0.1.5`. Both installed caches contained the same-profile restart guidance and neither profile installed Remote or Local as a side effect. Package validation and all four Claude strict validations passed after the version and contract update.

Final repository validation after recording the interactive evidence:

```text
node scripts/validate-package.mjs
PASS

claude plugin validate --strict .
claude plugin validate --strict plugins/ipzitalk
claude plugin validate --strict plugins/ipzitalk-remote
claude plugin validate --strict plugins/ipzitalk-local
PASS (4/4)

git diff --check
PASS
```

- Remote Skill directories: 27
- Remote HTML templates: 26
- Local Skill directories: 0
- symlinks under plugin and marketplace roots: 0
- secret patterns and personal absolute paths in the validated package/document scope: 0

## Interactive checks still required

Run each test in a new session after installing the candidate packages. Record only pass/fail and non-sensitive status; do not capture authorization URLs or credentials.

1. Codex Desktop: resume only after the team lifts the hold; verify the Korean plugin card and setup choices, a new local session, native login prompt, and representative Remote call.
2. OAuth cancellation/retry: use an approved isolated profile and verify that cancellation remains unauthenticated and retry uses only the official login flow.
3. Claude Local configure UI labels and masked-entry behavior were exercised without recording values; retain this check in future release regressions.
4. Remote↔OSS switching passed in the isolated profile; retain one representative Local and Remote call in future release regressions.

An already authenticated profile may reuse its stored session and show no browser. To test first-login behavior, use an approved isolated profile rather than deleting the user's active credentials.
