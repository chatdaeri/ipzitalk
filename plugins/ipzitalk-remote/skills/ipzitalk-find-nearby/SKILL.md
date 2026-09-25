---
name: ipzitalk-find-nearby
description: "주소 중심 반경 3km 이내 청약공고를 지도와 표로 비교하는 Ipzi Talk HTML 화면을 만든다."
version: 1.0.0
author: Synergy Labs + Hermes Agent
license: proprietary
metadata:
  hermes:
    tags: [ipzi-talk, presale, html-template]
    created_by: agent
---

# ipzitalk-find-nearby 반경 3km 청약공고 비교

## Trigger

“포일동 반경 3km 청약공고 보여줘”, “이 주소 주변 청약공고 비교해줘”

## Required input

- 중심 주소
- 반경 km

## Default test input

```txt
경기도 의왕시 포일동, 반경 3km
```

## Data/tool flow

Use **ipzitalk mcp** for live 청약공고/지도/공급정보 lookup when regenerating the screen.

1. 주소를 좌표화
2. ipzitalk mcp에서 반경 검색
3. 좌표 누락 공고는 주소 보완
4. 동적지도 iframe 포함 HTML 생성

## HTML template

- Included template: `templates/result.html`
- Sample input/backdata: `references/sample-input.json`, field reference: `references/data-schema.md`
- The template is **fixed**: markup, CSS, and rendering JS never change between runs. The only edit is the `ipzi-data` non-executable JSON block inside the bottom `<script>` block. Do not add/remove HTML elements or touch the render function.
- Map: set `ipzi-data.mapUrl` to the `get_map_embed_url` result. No static map image is used; leave `mapUrl: null` to hide the map panel entirely.

## User-facing HTML rules

- Use product name **Ipzi Talk**.
- Use user-facing wording such as `모집공고문 기준`, `청약홈 기준`, `자료 기준`, `확인 필요`.
- Do not show internal implementation/debug wording.
- For ipzitalk-read-notice-report (brief/limits/funding sections), keep internal comparison and review details in XLSX/backdata only; do not expose them in HTML.
- If official PDF/HWP extraction is incomplete, display `공고문 원문 확인 필요` instead of inventing values.

## Data source & cross-check

REF_DB stores `search_announcement_info` API responses verbatim, so it is already ground truth. The check here is **rendering fidelity**, not source accuracy — see `ipzitalk-presale-kit/references/db-source-labels.md` for the full mapping. Short version:

1. Diff every `listings[]` top-level field (`name`, `dateStr`, `addressDetail`, `maxPriceLabel`, `supplyCount`, `detailUrl`) against the matching `search_announcement_info` record. Only display formatting may differ; the underlying value must not change.
2. Diff every `listings[].units[]` entry (`type`, `maxPrice`, `supply`) against the record's raw unit array.
3. Set `ipzi-data.sourceNote` to a plain-language 출처 line using only user-facing labels — never internal table names:
   ```txt
   데이터 출처: 청약홈 분양정보 · 청약홈 주택형별 분양정보
   ```
   Append `· 주소 보완좌표(일부)` only when at least one listing used a geocode-fallback coordinate.
4. Set `ipzi-data.priceNote` to state that `maxPrice`/`maxPriceLabel` is a per-house-type max-price basis — REF_DB's `max_price_10k` is the highest-priced unit within that house type, not an average:
   ```txt
   표시된 금액은 주택형별 최고가 기준입니다. 평균가·최저가와 다를 수 있습니다.
   ```

## Acceptance checklist

- [ ] `templates/result.html` exists and only the `ipzi-data` non-executable JSON block was edited.
- [ ] HTML opens locally without external build steps.
- [ ] Visible HTML contains no `DB크로스체크`, `근거대조`, or implementation debug labels.
- [ ] No leftover sample/test data (place names, addresses) from `references/` remains in `ipzi-data` JSON.
- [ ] `ipzi-data.mapUrl` is a `get_map_embed_url` result.
- [ ] Repeated complex/location cells in the comparison table are grouped via `listings[].units[]` (the template renders `rowspan` automatically).
- [ ] Every `listings[]`/`units[]` value matches the raw `search_announcement_info` record verbatim (formatting aside).
- [ ] `ipzi-data.sourceNote` is set and uses only user-facing labels, never internal table names.
- [ ] `ipzi-data.priceNote` is set whenever `units[].maxPrice` is shown, stating the price is a per-house-type max-price basis.
- [ ] Any backdata/XLSX review material is delivered separately from the user-facing HTML.

## Output structure

```txt
out/<screen-name>/
  result.html
  backdata.xlsx        # when applicable
```


## MCP 도구 네임스페이스와 출처

ipzitalk MCP 도구의 네임스페이스는 실행 환경(Codex, Claude Code, Hermes, claude.ai 커넥터 등)에 따라 다르다.
이 문서에 적힌 도구 이름(`search_announcement_info`, `get_geocode`, `get_map_embed_url` 등)은 접두사 없는 **기본 도구명(base tool name)** 이다.

1. 먼저 연결된 도구 목록에서 같은 기본 도구명을 찾는다.
2. 그중 **`ipzitalk-remote` 플러그인의 `ipzitalk` 서버 provenance**가 확인되는 도구만 우선 사용한다. Codex에서는 실제 도구 호출 이벤트의 `server: ipzitalk`과 기본 도구명을 기준으로 확인한다.
3. `presale-mcp` 또는 다른 로컬 MCP provenance의 동명 도구는 Remote Skill의 대체 수단으로 사용하지 않는다.
4. provenance를 확인할 수 없거나 같은 기본 도구명이 여러 서버에 있어 모호하면 임의 선택하지 말고 중단하여 필요한 Remote 도구명을 안내한다.

클라이언트가 연결 도구 목록에 plugin/server provenance를 구조적으로 제공하지 않을 때만 다음 명시적 fallback을 사용한다.

1. `mcp__plugin_ipzitalk-remote_ipzitalk__<도구명>`
2. `mcp__ipzitalk_mcp__<도구명>`
3. `mcp__ipzitalk__<도구명>`
4. `mcp__claude_ai_ipzitalk__<도구명>`

fallback으로도 Remote 출처를 유일하게 확인할 수 없으면 값을 추정하지 말고, 사용자에게 ipzitalk Remote MCP 연결 상태를 확인하도록 안내한 뒤 중단한다.
