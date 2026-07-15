# Ipzi Talk

Ipzi Talk plugin marketplace for Codex and Claude Code.

> Internal proof of concept: this repository is not ready for public installation. The Skill source lock currently points to an unpublished local commit and the OSS npm package has not been published.

## PoC contents

- `ipzitalk`: setup-only launcher with no business MCP.
- `ipzitalk-remote`: hosted OAuth MCP plus six locked Remote Skills.
- `ipzitalk-local`: MCP-only Node.js payload with ten tools and zero Skills; its MCP server ID and npm package are `presale-mcp`.

The setup Skill asks the user to choose exactly one runtime. It derives status from `codex plugin list --json`; it does not create a separate state file or alter unrelated MCP servers.

## Support matrix

| Surface | Remote | OSS | Invocation and current boundary |
|---|---|---|---|
| Codex CLI | Internally validated | Conditional, CLI-only | Use `$ipzitalk:setup`; OSS still requires publication and registry verification. |
| Codex Desktop local workspace | Internally validated on earlier Remote payloads; `0.1.11` retest pending | Unsupported | Start a new local session after plugin changes. Safe Finder/Dock secret delivery for OSS has not been verified. |
| Claude Code CLI | Internally validated | Pending registry verification | Use `/reload-plugins`, `/ipzitalk:setup`, and `/mcp`. |
| Claude Desktop local Code tab | Remote validated through `0.1.10`; `0.1.11` retest in progress | Pending a separate-profile registry test | Use `+` → `Plugins` and a new local session; do not paste CLI-only plugin namespaces as raw commands. |
| Claude Desktop Chat or Cowork | Out of scope | Out of scope | These are not Claude Code plugin surfaces. |
| Claude remote/web sessions | Out of scope | Out of scope | The current plugin contract covers local Claude Code sessions only. |

`Internally validated` describes this private proof of concept, not a public support commitment. Remote and OSS must not be enabled together except in an isolated diagnostic profile. Platform command syntax differs because Codex and Claude expose different plugin interfaces; repository visibility does not change the command syntax. See [the detailed platform support matrix](docs/platform-support-matrix.md).

## Codex setup

Install the repository marketplace and launcher, start a new Codex process, and explicitly invoke `$ipzitalk:setup`:

```bash
codex plugin marketplace add /path/to/ipzitalk --json
codex plugin add ipzitalk@ipzitalk --json
```

Remote uses `https://ipzi-talk.synergylabs.kr/mcp`, OAuth, hosted data, and the six packaged Skills. OSS uses `npx -y presale-mcp@0.1.0` and forwards only these existing Codex process environment variables:

- `KAKAO_REST_API_KEY`
- `NAVER_MAPS_CLIENT_ID`
- `NAVER_MAPS_CLIENT_SECRET`
- `DATA_GO_KR_SERVICE_KEY`

Never paste their values into chat, plugin commands, manifests, or committed files. OSS is currently Codex CLI-only; a Finder/Dock-launched Codex Desktop process must not be assumed to inherit shell exports.

See [Codex setup and lifecycle](docs/codex-setup.md) for selection, OAuth, switching, updating, and complete removal.

## Claude Code setup

In Claude Code CLI, add the repository marketplace, install the launcher, and run `/reload-plugins`. The launcher is exposed as `/ipzitalk:setup`; after it installs the selected payload, run `/reload-plugins` again and verify it through `/mcp`.

In Claude Desktop's local Code tab, manage the marketplace and invoke installed plugin Skills through `+` → `Plugins`. Select `ipzitalk` → `setup` or the required Skill under `ipzitalk-remote`; do not paste the CLI namespace as a slash command. The Code tab does not expose `/reload-plugins`; after a plugin change, open a new local session and verify the launcher Skill and selected payload there. Do not treat Desktop Chat, Cowork, or remote sessions as Code-tab plugin tests.

Claude OSS keys are four required, sensitive `userConfig` values stored through Claude Code secure storage. Enter them only in the plugin configure UI; do not use `--config KEY=value` for secrets. See [Claude Code setup and lifecycle](docs/claude-setup.md).

## Validate

```bash
node scripts/validate-package.mjs
claude plugin validate --strict .
python3 /path/to/plugin-creator/scripts/validate_plugin.py plugins/ipzitalk
python3 /path/to/plugin-creator/scripts/validate_plugin.py plugins/ipzitalk-remote
python3 /path/to/plugin-creator/scripts/validate_plugin.py plugins/ipzitalk-local
```

The final three Python commands are compatibility checks against the installed `plugin-creator` validator. Do not install missing Python dependencies without approval.
