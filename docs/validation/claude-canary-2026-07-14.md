# Claude Code canary validation — 2026-07-14

## Environment and static validation

- Claude Code CLI: `2.1.208`
- `claude plugin validate --strict .`: passed
- Launcher strict validation: passed
- Remote strict validation: passed
- OSS strict validation: passed
- Source-controlled package validation: passed

The Claude marketplace contains the recommended `ipzitalk` launcher and the two runtime payloads. Remote and OSS declare MCP servers inline in their Claude manifests; the Codex companion `.mcp.json` files are not referenced by the Claude manifests.

## Isolated install

An isolated `CLAUDE_CONFIG_DIR` added the local marketplace and installed the launcher and Remote payload. `claude plugin details` reported:

```text
ipzitalk
  Skills (1): setup
  MCP servers (0)

ipzitalk-remote
  Skills (5)
  MCP servers (1): ipzitalk
```

The installed Remote plugin list contained one `ipzitalk` MCP definition with the expected hosted URL. This confirms that the inline manifest definition replaced default companion discovery rather than loading the Codex `.mcp.json` as a second server.

The documented Claude invocation is `/ipzitalk:setup`. A live interactive `/reload-plugins` and slash-command invocation were not performed in the isolated config because it did not contain an authenticated Claude session.

## OSS user configuration

The same isolated config installed `ipzitalk-local` without supplying values. Installation succeeded and reported:

```text
4 userConfig options not yet set (4 required)
```

The plugin inventory showed zero Skills and exactly one `ipzitalk-local` MCP server. Its four environment values remained `${user_config.KEY}` placeholders. No secret values were supplied or printed.

The CLI suggested either `/plugin configure` or `--config KEY=VALUE`. Ipzi Talk documentation permits only the configure UI for sensitive values because command arguments may be logged. Actual secure-storage masking, subprocess substitution, `/reload-plugins`, `/mcp`, OAuth, and local Code-tab behavior still require an authenticated interactive validation pass.

Both runtime payloads were installed together only in this isolated diagnostic config to inspect provenance. This is not a supported operating state; setup must report `conflict` and must not remove either automatically.

## Local server identity correction

The earlier `ipzitalk-local` MCP server name above records the original canary and is superseded by the unified contract. The runtime plugin remains `ipzitalk-local`, but its MCP server ID and npm package are now `presale-mcp`.

`claude plugin validate --strict plugins/ipzitalk-local` passed after the change. A fresh isolated Claude configuration installed the Local plugin without secret values and reported zero Skills plus exactly one MCP server named `presale-mcp`; all four required `userConfig` values remained unset.

## Authenticated user-profile CLI E2E

The current Claude Code `2.1.208` user profile initially contained only unrelated Telegram and Warp plugins. The local Ipzi Talk marketplace was added, then launcher `0.1.1` and Remote `0.1.2` were installed at user scope. Plugin inventory reported launcher Skills 1 / MCP 0 and Remote Skills 5 / MCP 1 (`ipzitalk`); the unrelated plugins remained enabled and unchanged.

A new non-interactive Claude Code process invoked `/ipzitalk:setup status only`. It derived a clean `Remote` state, confirmed that Local was absent, identified all five `ipzitalk-remote:*` Skills, and made no plugin, settings, credential, MCP, cache, or file changes.

The plugin MCP initially reported `Needs authentication`. The official `claude mcp login plugin:ipzitalk-remote:ipzitalk` browser flow completed, after which `claude mcp get` reported `Connected`. No authorization URL, redirect value, or credential is recorded here.

An allowlisted single-tool print session then called `mcp__plugin_ipzitalk-remote_ipzitalk__get_geocode` exactly once for 서울특별시 중구 세종대로 110. It returned the exact 서울시청 match at latitude `37.5666103`, longitude `126.9783882`, with legal-dong code `1114010300`. No web, shell, file, or second MCP tool was allowed.

An authenticated interactive Claude Code session then ran `/reload-plugins`. The command reported four plugins, zero newly reloaded Skills, six agents, six hooks, and two plugin MCP servers. Despite the reload summary's zero-Skill field, `/ipzitalk:setup status only` resolved to the installed launcher Skill and exposed its plugin base directory. The Skill requested one read-only `claude plugin list --json` command under the default approval policy; the one-time `Yes` option was selected, not the persistent allow option. It again derived `Remote`, confirmed Local was absent, reported the five packaged Remote Skills, and made no changes.

This completes the Claude Code CLI install, interactive reload, setup status, default-policy approval observation, OAuth, namespace, and representative Remote call gates. The remaining approval-policy matrix, sensitive Local `userConfig`, and Claude Code Desktop Code-tab checks remain incomplete. Claude Desktop was opened for the Code-tab pass, but the automation session had neither an attached in-app browser nor macOS Accessibility permission, so no Code-tab result is inferred from the CLI evidence.

The user then confirmed directly that Claude Desktop's Code tab does not expose `/reload-plugins`. This agrees with the official Desktop split: CLI uses slash commands, while the Code tab manages plugins through `+` → `Plugins`. Code-tab validation must therefore use the plugin manager UI followed by a new local session; the CLI reload result is not a Desktop test.

The current Desktop build also rejected a raw `/ipzitalk-remote:ipzitalk-presale-report` string as a CLI-only command. The working invocation path is `+` → `Plugins` → `ipzitalk-remote` → the selected Skill; the launcher uses the same menu under `ipzitalk` → `setup`. Desktop evidence must record that UI selection rather than infer invocation from a typed slash string or the generic Slash commands list.

In that Code-tab plugin manager, the user observed `ipzitalk` with exactly the `setup` Skill and `ipzitalk-remote` with exactly five Skills; the unrelated Telegram plugin remained present. This verifies Desktop UI discovery and component separation, but not Skill invocation, MCP connection, OAuth reuse, or a Remote tool call. Those require a new local Code-tab session.

The user then opened a new local Code-tab session and invoked `ipzitalk:setup` with `status only`. The Skill listed the installed Claude plugins and returned `Remote`: launcher `0.1.1` and Remote `0.1.2` were installed and enabled at user scope, Local was absent, and no conflict existed. It described the hosted MCP and five Remote Skills and explicitly reported that the status-only run made no changes. This completes Desktop launcher discovery, Skill invocation, state inspection, and no-mutation verification; a Desktop Remote tool call is still required to prove MCP connection and OAuth reuse.

In the same local Code-tab session, the user constrained the next request to one `get_geocode` MCP invocation and prohibited web, shell, and file tools. The UI displayed two tool activities because it counted schema loading separately, while the actual MCP tool `mcp__plugin_ipzitalk-remote_ipzitalk__get_geocode` ran exactly once. It returned the same exact 서울시청 result as the CLI canary: latitude `37.5666103`, longitude `126.9783882`, and legal-dong code `1114010300`, with `cache_hit: true`. No interactive login or credential input appeared, and no web, shell, or file tool ran. This completes the Desktop Remote MCP connection, existing-authentication availability, plugin namespace, and representative call gate without claiming that all five packaged Skills were invoked.

## Desktop packaged-Skill forward test

The first Code-tab `ipzitalk-presale-report` run functionally reached the correct Remote provenance. It called `mcp__plugin_ipzitalk-remote_ipzitalk__search_announcement_info` once and `mcp__plugin_ipzitalk-remote_ipzitalk__get_map_embed_url` once, returned all 32 남양주시 announcements with `has_more: false`, and reproduced the locked aggregate checks: 10,589 total units, 6,588 disclosed unit rows, three recent announcements with 1,615 units, 21 merged map markers, and five unlocated announcements. No extra OAuth prompt appeared.

The run is not a strict pass. It used Bash `ls` once despite the explicit no-shell constraint. The generated scratchpad HTML also changed fixed template content outside `window.__DATA__`: the document title, comments, and part of the renderer warning logic differed from the installed `0.1.2` template. Its visible mix note additionally exposed more internal reconciliation detail than the Skill's one-line public caption rule permits. The generated report was not copied into this repository. Record this as functional routing and data-contract evidence only; repeat the Skill with the Code-tab Skill picker, direct file reads, zero shell calls, and a byte-identical fixed template outside `window.__DATA__` before marking one of five packaged Skills complete.

The second run used File Read and File Write with zero shell or web calls. Its fixed prefix and suffix were byte-identical to `templates/result.html`, and it repeated the two expected Remote MCP calls and locked aggregates. The visible `mixNote` still included the internal LH/public-supply reconciliation reason rather than the required one-line public caption, so the presentation contract remained incomplete.

More importantly, the run reported its source as `~/.claude/skills/ipzitalk-presale-report`, not the installed plugin cache. Three global Claude Skills overlap this canary payload: `ipzitalk-presale-report`, `ipzitalk-location-report`, and `ipzitalk-complex-overview-all`. The global presale Skill body hash differs from the plugin `0.1.2` body even though their template hashes match. Therefore the second run proves a clean shell-free render against an equivalent template but does not prove packaged-Skill provenance. Do not remove or move the global Skills automatically. Treat this as a `Remote + Skill provenance conflict` and require an isolated Claude profile or an explicitly approved temporary disable/restore procedure before the five-Skill E2E can complete.

The third run explicitly selected `+` → `Plugins` → `ipzitalk-remote` → `ipzitalk-presale-report`. The session transcript confirms that File Read used the installed plugin cache path under `ipzitalk-remote/0.1.2`, followed by exactly one plugin-namespaced announcement call, one plugin-namespaced map call, and one scratchpad File Write; no Bash or web call occurred in that run. The generated file's prefix and suffix are byte-identical to the installed plugin template, with no external script, stylesheet, or absolute path. This resolves packaged-Skill provenance for explicit Desktop UI selection even while the three global duplicates remain present; natural-language auto-routing is still ambiguous and must not be used as provenance evidence.

The third run still is not a full presentation-contract pass. Its visible `mixNote` says that LH/public-sale announcements do not expose every unit type, while the Skill requires the public screen to use only a short disclosed-unit basis caption and keep internal reconciliation reasons out of the report. Record the result as packaged-Skill functional E2E passed, strict rendering contract pending one copy correction. No additional OAuth prompt appeared; this means the existing authenticated connection was available, not that Remote authentication is unnecessary.
