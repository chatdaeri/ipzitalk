# Ipzi Talk

Ipzi Talk plugin marketplace for Codex and Claude Code.

> Internal proof of concept: this repository is not ready for public installation. The Skill source lock currently points to an unpublished local commit and the OSS npm package has not been published.

## PoC contents

- `ipzitalk`: setup-only launcher with no business MCP.
- `ipzitalk-remote`: hosted OAuth MCP plus five locked Remote Skills.
- `ipzitalk-local`: MCP-only Node.js payload with ten tools and zero Skills.

The setup Skill asks the user to choose exactly one runtime. It derives status from `codex plugin list --json`; it does not create a separate state file or alter unrelated MCP servers.

## Codex setup

Install the repository marketplace and launcher, start a new Codex process, and explicitly invoke `$ipzitalk:setup`:

```bash
codex plugin marketplace add /path/to/ipzitalk --json
codex plugin add ipzitalk@ipzitalk --json
```

Remote uses `https://ipzi-talk.synergylabs.kr/mcp`, OAuth, hosted data, and the five packaged Skills. OSS uses `npx -y presale-mcp@0.1.0` and forwards only these existing Codex process environment variables:

- `KAKAO_REST_API_KEY`
- `NAVER_MAPS_CLIENT_ID`
- `NAVER_MAPS_CLIENT_SECRET`
- `DATA_GO_KR_SERVICE_KEY`

Never paste their values into chat, plugin commands, manifests, or committed files. OSS is currently Codex CLI-only; a Finder/Dock-launched Codex Desktop process must not be assumed to inherit shell exports.

See [Codex setup and lifecycle](docs/codex-setup.md) for selection, OAuth, switching, updating, and complete removal.

## Validate

```bash
node scripts/validate-package.mjs
python3 /path/to/plugin-creator/scripts/validate_plugin.py plugins/ipzitalk
python3 /path/to/plugin-creator/scripts/validate_plugin.py plugins/ipzitalk-remote
python3 /path/to/plugin-creator/scripts/validate_plugin.py plugins/ipzitalk-local
```

The final three commands are compatibility checks against the installed `plugin-creator` validator. Do not install missing Python dependencies without approval.
