# Claude Code setup and lifecycle

This document covers Claude Code CLI and the local Code tab. It does not claim support for Claude Desktop Chat/Cowork or remote/web sessions.

## Install the launcher

Add the local marketplace for this proof of concept and install the recommended launcher:

```bash
claude plugin marketplace add /path/to/ipzitalk --scope user
claude plugin install ipzitalk@ipzitalk --scope user
```

Run `/reload-plugins` in Claude Code, then invoke `/ipzitalk:setup`. The setup Skill explains Remote and OSS and waits for an explicit choice before installing a runtime payload.

## Remote

The approved install command is:

```bash
claude plugin install ipzitalk-remote@ipzitalk --scope user
```

Run `/reload-plugins`, open `/mcp`, and complete OAuth for the plugin-provided `ipzitalk` server. Remote includes five Skills and the hosted data path.

## OSS

The approved install command is:

```bash
claude plugin install ipzitalk-local@ipzitalk --scope user
```

The plugin declares four `string` options that are both `required` and `sensitive`. Configure them through the plugin manager UI:

- `KAKAO_REST_API_KEY`
- `NAVER_MAPS_CLIENT_ID`
- `NAVER_MAPS_CLIENT_SECRET`
- `DATA_GO_KR_SERVICE_KEY`

Sensitive values are masked and stored through Claude Code secure storage. Do not pass them through `--config KEY=value`, paste them into chat, or place them in settings, manifests, logs, or documentation.

After configuration, run `/reload-plugins` and verify the `ipzitalk-local` plugin's `presale-mcp` server through `/mcp`. The committed command remains registry-backed and cannot be marked complete until `presale-mcp@0.1.0` is published. OSS contains ten tools and no Skills.

## Switch and remove

Switching uses uninstall, install, reload, and verify. Each mutation is separately approved. For Remote to OSS:

```bash
claude plugin uninstall ipzitalk-remote@ipzitalk
claude plugin install ipzitalk-local@ipzitalk --scope user
```

Use the reverse pair for OSS to Remote. If uninstall fails or is declined, do not install the other payload. If installation fails, report `not installed` and offer the previous payload's install command separately.

For complete removal, uninstall the selected payload first and `ipzitalk@ipzitalk` second. Run `/reload-plugins` after changes. Never alter Claude settings, credential storage, marketplace files, or plugin caches by hand.
