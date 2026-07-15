---
name: ipzitalk-find-region
description: Build an Ipzi Talk “희망지역 최근 청약공고 + 지도” HTML screen from ipzitalk mcp tools. Use when the user asks for a 지역별 최근 청약공고 화면, 희망지역 화면, 지도 포함 청약공고 목록, or packaging the region dashboard. Enforces dynamic map iframe, geocode fallback for missing REF_DB coordinates, and rowspan cell-merged unit tables.
version: 2.0.0
author: Hermes Agent
license: MIT
metadata:
  hermes:
    tags: [ipzi-talk, presale, ipzitalk-mcp, dashboard, html, map]
---

# ipzitalk-find-region 희망지역 청약공고 HTML

## Trigger

Use this skill when the user asks for:

- `A1 희망지역` 화면
- 지역의 최근 청약공고 HTML
- 청약공고 지도 포함 목록
- Ipzi Talk 청약/분양 HTML 샘플
- 같은 단지 주택형 셀 병합 표

Do **not** package this into a broader skill set unless the user explicitly asks. If the user only asks for a plan, write a plan/ASCII MD first and do not implement.

## Goal

Create one user-facing HTML page for:

> “내가 말한 지역의 최근 청약공고를 전부 훑고 싶다.”

The page must show:

1. 지역 최근 청약공고 summary (KPI)
2. dynamic map (iframe) embedded in the HTML
3. `위치 확인 필요` panel only for records that truly cannot be geocoded
4. recent announcement cards
5. unit comparison table where repeated apartment/presale rows are merged with `rowspan`

## Template contract

`templates/result.html` is a **fixed** file: markup, CSS, and rendering JS never change between runs. The only thing you edit is the `ipzi-data` non-executable JSON block inside the `<script>` block at the bottom of the file. Do not add/remove HTML elements, do not touch the `<style>` block, do not rewrite the render function.

`references/data-schema.md` documents every `ipzi-data` JSON field.

## Reference notes

See `references/live-ipzitalk-mcp-workflow.md` for the live MCP/OAuth-token workflow, cross-boundary radius search pattern, stale namespace pitfall after MCP rename, and deterministic verification checklist from the Poil-dong run.

## Required ipzitalk mcp tool flow

Run the data flow in this order.

### 1. Search announcements

Call `search_announcement_info`:

```json
{
  "sigungu": "<지역>",
  "umd": "<optional 동>",
  "date_from": "<optional YYYY-MM-DD>",
  "date_to": "<optional YYYY-MM-DD>",
  "exclusive_area_sqm": "<optional number>",
  "include_units": true,
  "limit": 100,
  "offset": 0,
  "unlocated_limit": 50
}
```

If `summary.has_more` is true, call the same tool again with `offset = summary.next_offset` until all pages are collected or the user’s requested scope is reached.

### 2. Fill missing coordinates before deciding “위치 확인 필요”

Do **not** mark a record as `위치 확인 필요` merely because `search_announcement_info` returned `lat/lng: null`.

For every presale with missing coordinates:

1. Extract a precise jibun/road address from `address`.
   - Good examples: `경기도 김포시 사우동 173-1`, `경기도 김포시 사우동 475-2`
   - If the address contains block text, parse the parenthesized jibun first.
2. Call `get_geocode` with the extracted address.
3. If geocode returns `confidence: exact` or a plausible normalized address in the same sigungu/umd, use that coordinate and label it `주소 보완좌표`.
4. If geocode fails, call `get_address` using the presale name or extracted address.
5. If `get_address` returns a same-area apartment/place candidate, use that coordinate and label it `주소 보완좌표`.
6. Only after both attempts fail should the record appear under `위치 확인 필요`.

### 3. Build the map payload

Call `get_map_embed_url` with markers for every located/coordinate-filled record:

```json
{
  "markers": [
    {"lat": 37.0, "lng": 127.0, "name": "공고명", "info": "공고일 · 위치 · 최고가", "color": "#2563eb"}
  ],
  "maptype": "normal",
  "title": "<지역> 희망지역 청약공고 지도"
}
```

Set `ipzi-data.mapUrl` to the returned embed URL — the template's iframe and "지도 크게 열기" link pick it up automatically. Do not call `get_static_map`; this screen has no static image asset.

### 4. Fill `ipzi-data` 비실행 JSON 블록

Populate `title`, `desc`, `chips`, `kpis`, `mapUrl`/`mapTitle`/`mapDesc`/`mapHint`, `unlocated` (records that failed both geocode attempts, with a `reason`), `listings` (each with `units[]` for the rowspan table), and `footNote`. See `references/data-schema.md` for field-level detail.

HTML must use product/user language, not implementation language.

Allowed copy:

```txt
Ipzi Talk
청약홈 DB 기준
DB 저장 최고 분양가 기준
지도 기준: 청약홈 DB 좌표 + 주소 보완좌표
위치 확인 필요
주소 보완좌표
공고문 원문 확인 필요
지도 크게 열기
```

Forbidden copy in user-facing HTML:

```txt
Presale Dashboard Pack
source
result
render
backdata
validation
fixture
기존 MCP 표시명
검증 패널
개발자 확인
구현자 확인
```

## Rowspan table rule

The template's rendering JS builds `rowspan` automatically from `listings[].units[]` — one row per unit, the first row of each listing carries the merged 단지/위치/원문 cells. You never write `rowspan` by hand; just make sure each listing's `units` array has every unit for that presale.

Acceptance criterion: if the same complex/presale name repeats in the first table column for each unit row, the artifact fails (meaning a bug in the `units` grouping, not the template).

## Data source & cross-check

REF_DB stores `search_announcement_info` API responses verbatim, so it is already ground truth — there is no separate original document to reconcile the way ipzitalk-read-notice-report's brief/limits/funding sections reconcile PDF extraction against the DB. The check here is **rendering fidelity**, not source accuracy. See `ipzitalk-presale-kit/references/db-source-labels.md` for the full table → user-facing label mapping; the short version:

1. Diff every `listings[]` top-level field (`name`, `dateStr`, `addressDetail`, `maxPriceLabel`, `supplyCount`, `detailUrl`) against the matching `search_announcement_info` record for that `announcement_id`. Only display formatting may differ (e.g. `1079000000` → `"10.79억"`); the underlying value must not change. A mismatch is a rendering bug, not a `위치 확인 필요` case.
2. Diff every `listings[].units[]` entry (`type`, `maxPrice`, `supply`) against the record's raw unit array.
3. Set `ipzi-data.sourceNote` to a plain-language 출처 line built only from user-facing labels — never internal table names (`REF_DB`, `presales`, `presale_units` are implementation words and stay out of the HTML):
   ```txt
   데이터 출처: 청약홈 분양정보 · 청약홈 주택형별 분양정보
   ```
   Append `· 주소 보완좌표(일부)` only when at least one listing used a geocode-fallback coordinate.
4. Set `ipzi-data.priceNote` to state that `maxPrice`/`maxPriceLabel` is a per-house-type max-price basis — REF_DB's `max_price_10k` is the highest-priced unit within that house type, not an average across units or floors:
   ```txt
   표시된 금액은 주택형별 최고가 기준입니다. 평균가·최저가와 다를 수 있습니다.
   ```

## Deterministic verification

Before delivering, run checks equivalent to:

1. HTML file exists and is non-empty.
2. `ipzi-data.mapUrl` is a `get_map_embed_url` result (or `null` only when there is truly nothing to map).
3. `rowspan="` appears in the rendered output when `listings` has entries.
4. Forbidden user-facing strings are absent from the file (outside of `ipzi-data` JSON, they should never appear at all).
5. Records with exact geocode fallback are not present in `ipzi-data.unlocated`.
6. No test/sample place names (e.g. from `references/data-schema.md` examples) remain in `ipzi-data` JSON.
7. Every `listings[]`/`units[]` value matches the raw `search_announcement_info` record verbatim (formatting aside) — see "Data source & cross-check" above.
8. `ipzi-data.sourceNote` is set and uses only user-facing labels, never internal table names.
9. `ipzi-data.priceNote` is set whenever `units[].maxPrice` is shown, stating the price is a per-house-type max-price basis (REF_DB's `max_price_10k` is the highest unit price, not an average).

## Delivery

Deliver a single file: `result.html`. No assets folder, no zip — the map is an iframe, not an image.

Final report should include:

- which ipzitalk mcp tools were called
- matched/returned count
- how many records used original DB coordinates vs address fallback coordinates
- how many records remain in `위치 확인 필요`
- number of listings rendered in the rowspan table
- output file path


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
