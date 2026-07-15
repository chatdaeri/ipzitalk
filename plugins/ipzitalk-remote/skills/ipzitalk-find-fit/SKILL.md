---
name: ipzitalk-find-fit
description: "사용자 소득·현금·대출조건과 희망면적을 기준으로 Ipzi Talk 청약공고 후보를 선별하고 HTML 표로 보여준다."
version: 1.0.0
author: Synergy Labs + Hermes Agent
license: proprietary
metadata:
  hermes:
    tags: [ipzi-talk, presale, html-template]
    created_by: agent
---

# ipzitalk-find-fit 나에게 맞는 청약공고 찾기

## Trigger

“내 조건으로 청약 가능한 공고 찾아줘”, “의왕시 84㎡ 월소득 650, 현금 2억 기준으로 찾아줘”

## Required input

- 지역명
- 희망 전용면적
- 월소득
- 보유현금
- 금리
- 대출기간

## Default test input

```txt
의왕시, 전용 84㎡, 월소득 650만원, 현금 2억원, 금리 4.2%, 30년
```

## Data/tool flow

Use **ipzitalk mcp** for live 청약공고/지도/공급정보 lookup when regenerating the screen.

1. ipzitalk mcp에서 지역/공고 검색
2. 주택형·분양가·공급세대수 정리
3. 대출 상환액과 현금부담을 계산
4. 반복 단지명은 rowspan으로 병합한 HTML 생성

## HTML template

- Included template: `templates/result.html`
- Sample input/backdata: `references/sample-input.json`, field reference: `references/data-schema.md`
- The template is **fixed**: markup, CSS, and rendering JS never change between runs. The only edit is the `ipzi-data` non-executable JSON block inside the bottom `<script>` block. Do not add/remove HTML elements or touch the render function.

## User-facing HTML rules

- Use product name **Ipzi Talk**.
- Use user-facing wording such as `모집공고문 기준`, `청약홈 기준`, `자료 기준`, `확인 필요`.
- Do not show internal implementation/debug wording.
- For ipzitalk-read-notice-report (brief/limits/funding sections), keep internal comparison and review details in XLSX/backdata only; do not expose them in HTML.
- If official PDF/HWP extraction is incomplete, display `공고문 원문 확인 필요` instead of inventing values.

## Data source & cross-check

REF_DB stores `search_announcement_info` API responses verbatim, so it is already ground truth. The check here is **rendering fidelity**, not source accuracy — see `ipzitalk-presale-kit/references/db-source-labels.md` for the full mapping. Short version:

1. Diff every `listings[]` top-level field (`name`, `locationLabel`, `addressDetail`, `dateStr`, `detailUrl`) against the matching `search_announcement_info` record. Only display formatting may differ; the underlying value must not change.
2. Diff every `listings[].units[].type` / `.maxPrice` / `.supply` against the record's raw unit array. `cls` (가능/아슬아슬/초과) and `diff` (예산 차이) are locally computed from the user's loan inputs — they are not DB fields and don't need a DB match, but they must be recomputed correctly from `maxPrice` and the affordability inputs.

## 추정 계산 규칙 (고정)

실행마다 값이 달라지지 않도록 아래 공식을 그대로 쓴다. 사용자가 다른 값을 지정하면 그것을 따르고 `kpis[].sub`에 명시한다.

```txt
월상환 가능액   = 월소득 × 0.35          (기본 상환비율 35%)
대출한도       = 월상환 가능액 × (1 − (1 + r)^−n) / r    (원리금균등)
                 r = 연금리 / 12,  n = 대출기간(년) × 12
추정 가능 주택가격 = 대출한도 + 보유현금
```

`kpis` 4개 박스는 순서와 내용을 고정한다. **값을 서로 바꿔 넣지 않는다.**

| # | label | value | sub |
|---|---|---|---|
| 0 | 추정 가능 주택가격 | 대출한도 + 보유현금 | `대출 {대출한도} + 보유현금 {현금}` |
| 1 | 월상환 가능액 | 월소득 × 35% | `월소득 {월소득}의 35% 가정` |
| 2 | 가능 후보 | `cls`가 `g`인 주택형 수 | 아슬아슬 포함 시 개수 |
| 3 | 초과 후보 | `cls`가 `o`인 주택형 수 | 대상 공고 수 |

렌더 전 검산: `kpis[0].value == 대출한도 + 보유현금` 이고 `kpis[1].value < 월소득` 이어야 한다.
`kpis[1]`(월상환 가능액)에 억 단위 금액이 들어가 있으면 박스가 뒤바뀐 것이다.

## 예산 차이(`diff`) 부호 규약

`diff = 추정 가능 주택가격 − 분양가` 를 그대로 문자열로 쓴다. **부호를 반드시 방향에 맞게 붙인다.**

| 상황 | `cls` | `diff` 예시 | 의미 |
|---|---|---|---|
| 예산이 남음 | `g` (가능) | `"+66,639만원"` | 6억 6,639만원 여유 |
| 예산에 근접 | `a` (아슬아슬) | `"+1,200만원"` | 1,200만원 여유 |
| 예산 초과 | `o` (초과) | `"-34,198만원"` | 3억 4,198만원 부족 |

🚨 모든 unit에 `-`를 붙이는 것은 버그다. "가능"으로 분류된 후보에 `-66,639만원`이 표시되면 사용자는 6.6억이 **부족한 것으로 오독**한다.
`cls`가 `g`/`a`인데 `diff`가 음수이거나, `cls`가 `o`인데 `diff`가 양수이면 계산이 틀린 것이다 — 렌더 전에 부호와 `cls`의 일관성을 검사한다.

## 청약이 종료된 과거 공고

`search_announcement_info`는 과거 공고도 함께 반환한다. 공고일이 지나 청약이 이미 끝난 공고를 후보로 낼 때는 **가격 참고용임을 반드시 명기한다.**

- 해당 listing의 `dateStr` 뒤에 `· 청약 종료(가격 참고용)`를 덧붙인다. 예: `"2023-10-30 · 청약 종료(가격 참고용)"`
- 종료된 공고가 하나라도 포함되면 `footNote`에 다음 문장을 포함한다:
  ```txt
  공고일이 지난 공고는 청약이 이미 종료되어 신청할 수 없으며, 시세 비교를 위한 가격 참고용입니다.
  ```
- 진행 중인 공고와 종료된 공고를 시각적으로 구분하지 않은 채 같은 "가능 후보"로 제시하지 않는다.
3. Set `ipzi-data.sourceNote` using only user-facing labels — never internal table names:
   ```txt
   데이터 출처: 청약홈 분양정보 · 청약홈 주택형별 분양정보
   ```
4. Set `ipzi-data.priceNote` to state that `maxPrice` and the `diff` (예산 차이) computed from it are a per-house-type max-price basis:
   ```txt
   표시된 금액과 예산 차이는 주택형별 최고가 기준입니다. 평균가·최저가와 다를 수 있습니다.
   ```

## Acceptance checklist

- [ ] `templates/result.html` exists and only the `ipzi-data` non-executable JSON block was edited.
- [ ] HTML opens locally without external build steps.
- [ ] Visible HTML contains no `DB크로스체크`, `근거대조`, or implementation debug labels.
- [ ] No leftover sample/test data (place names, addresses) from `references/` remains in `ipzi-data` JSON.
- [ ] Repeated complex/location cells in the comparison table are grouped via `listings[].units[]` (the template renders `rowspan` automatically).
- [ ] Every `listings[]`/`units[].type`/`.maxPrice`/`.supply` value matches the raw `search_announcement_info` record verbatim (formatting aside); `cls`/`diff` are correctly recomputed from the affordability inputs.
- [ ] `diff`의 부호가 `cls`와 일관된다 — `g`/`a`는 양수(`+`), `o`는 음수(`-`). 모든 unit이 같은 부호를 갖고 있으면 실패로 본다.
- [ ] 월상환 가능액 = 월소득 × 35%(또는 사용자 지정값)이고, `kpis[0]`(가능 주택가격) = 대출한도 + 보유현금이다. `kpis[1]`에 억 단위 금액이 들어가 있지 않다.
- [ ] 청약이 종료된 과거 공고가 포함된 경우 `dateStr`에 `· 청약 종료(가격 참고용)`가 붙고, `footNote`에 가격 참고용 안내 문장이 있다.
- [ ] `ipzi-data.sourceNote` is set and uses only user-facing labels, never internal table names.
- [ ] `ipzi-data.priceNote` is set whenever `maxPrice`/`diff` is shown, stating the price and budget gap are a max-price basis.
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
