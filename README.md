# Ipzi Talk

Ipzi Talk plugin marketplace for Codex and Claude Code.

> Internal canary: this repository is not ready for public installation. The current checkpoint validates the Codex setup Skill and hosted Remote MCP namespace without bundling Remote Skills.

## Canary contents

- `ipzitalk`: setup-only launcher with no business MCP.
- `ipzitalk-remote`: hosted Remote MCP canary with zero bundled Skills.
- `ipzitalk-local`: not packaged until the next checkpoint.

The public flow will ask the user to choose exactly one of Remote or OSS. OSS remains MCP-only and will not bundle or claim compatibility with the Remote Skills.

## Validate

```bash
node scripts/validate-package.mjs
python3 /path/to/plugin-creator/scripts/validate_plugin.py plugins/ipzitalk
python3 /path/to/plugin-creator/scripts/validate_plugin.py plugins/ipzitalk-remote
```

The final two commands are compatibility checks against the installed `plugin-creator` validator. Do not install missing Python dependencies without approval.
