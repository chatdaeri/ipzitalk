---
name: ipzitalk-read-notice-report
description: "공식 모집공고문 PDF/HWP 하나에서 1분 브리핑·청약 일정 체크리스트·자금 조달 타임라인·제한사항 요약을 한 번에 뽑아 통합 공고 리포트 HTML을 만든다. 일부 섹션만 요청하면 해당 섹션만 렌더한다. (구 read-brief/read-dday/read-funding/read-limits 통합)"
version: 1.1.0
author: Synergy Labs + Hermes Agent
license: proprietary
metadata:
  hermes:
    tags: [ipzi-talk, presale, html-template]
    created_by: agent
---

# ipzitalk-read-notice-report 공고 리포트 (조립 · L2)

> tier: L2 · 구 read-brief / read-dday / read-funding / read-limits 4개 스킬 통합본.

공고 하나를 pin 하고, **PDF 확보·텍스트 추출·DB 크로스체크를 1회만** 수행한 뒤
브리핑(brief) · 일정(dday) · 자금(funding) · 제한사항(limits) 4개 섹션이 그 결과를 공유한다.
(ipzitalk-location-report가 교통·생활·교육 3분야에서 좌표를 1회만 해소해 공유하는 것과 같은 원리 — 재추출 금지.)

## Trigger

- 전체 리포트: “이 공고 리포트 만들어줘”, “이 공고 핵심 정리해줘”
- 브리핑만: “이 공고 1분 브리핑 만들어줘”, “공고 핵심만 요약해줘”
- 일정만: “이 공고 일정 체크리스트 만들어줘”, “청약 일정 놓치지 않게 정리해줘”
- 자금만: “이 공고 자금 타임라인 만들어줘”, “84A 기준 계약금 중도금 잔금 일정 뽑아줘”
- 제한만: “이 공고 제한사항 요약해줘”, “전매제한/거주의무/재당첨제한만 뽑아줘”

## Required input

- 청약 공고명 또는 청약홈 상세 URL
- 공식 모집공고문 PDF/HWP (brief/funding/limits 섹션에 필수)
- 기준 주택형 (funding 섹션에 필수 — 없으면 사용자에게 확인)

## Default test input

```txt
안양 에버포레 자연앤 e편한세상(A2BL), 084.9794A 기준
```

## Section toggle

| 섹션 키 | 내용 | 원 스킬 | 주 데이터 소스 |
|---|---|---|---|
| `brief` | 1분 요약 + 주택형/가격 표 | read-brief | 모집공고문 PDF |
| `dday` | 일정 체크리스트 + 타임라인 | read-dday | ipzitalk mcp, 모호하면 공고문 |
| `limits` | 제한사항 카드 + 상담 질문 | read-limits | 모집공고문 원문 문장 |
| `funding` | 납부 타임라인 + 회차별 납부표 | read-funding | 모집공고문 납부조건 표 |

- 사용자가 특정 섹션만 요청하면 나머지 섹션 키를 `null`로 둔다 → 템플릿이 자동으로 숨긴다.
- 전체 리포트 요청이면 4개 섹션을 모두 채운다.
- 핵심 일정·핵심 제한은 dday/limits 섹션이 담당한다. brief 섹션에 중복 배치하지 않는다.

## Data/tool flow

Use **ipzitalk mcp** for live 청약공고/지도/공급정보 lookup when regenerating the screen.

1. 공고 pin — `house_manage_no` + `announcement_id` 확정 (1회)
2. 공식 모집공고문 PDF/HWP 확보 (1회)
3. pdftotext(-layout) 또는 HWPX 텍스트 추출 (1회)
4. 요청된 섹션별 구조화 — 공급대상/공급금액/일정/제한사항/납부조건
   - 🚨 **가격 평균은 층별 세대수 가중평균으로만 낸다.** 주택형별 평균 분양가 = `Σ(층구간 세대수 × 층구간 공급금액) ÷ 주택형 총세대수`.
     층구간 단순평균(구간 수로 나누기) 금지. 평균 평당가 = `평균 분양가 ÷ (공급면적㎡ ÷ 3.3058)` — 최고가 기준 아님.
   - 층별 세대수 합 = 주택형 총세대수, 주택형 총세대수 합 = 공고 총 공급세대수인지 검산하고 백데이터에 남긴다.
5. 백데이터 XLSX 생성 (섹션 통합 1개 파일)
   - `공급금액` 시트에 층구간별 세대수·공급금액 원본 행을 그대로 남기고, `공급대상` 시트에 `세대수가중평균(원)`·`평균평당가(만원)` 열로 계산 결과를 남긴다.
6. 사용자 HTML에는 원문 기준 요약만 노출

## HTML template

- Included template: `templates/result.html`
- Sample input/backdata: `references/sample-input.json`, field reference: `references/data-schema.md`
- The template is **fixed**: markup, CSS, and rendering JS never change between runs. The only edit is the `window.__DATA__` object inside the bottom `<script>` block. Do not add/remove HTML elements or touch the render function.
- Layout: hero(공고명 + chips) → 요약 KPI 4개 → ①1분 브리핑 → ②일정 체크리스트 → ③자금 타임라인 → ④제한사항 → 푸터. 각 섹션은 `__DATA__.<key>`가 null이면 숨김.

## User-facing HTML rules

- Use product name **Ipzi Talk**.
- Use user-facing wording such as `모집공고문 기준`, `청약홈 기준`, `자료 기준`, `확인 필요`.
- Do not show internal implementation/debug wording.
- Keep internal comparison and review details in XLSX/backdata only; do not expose them in HTML.
- If official PDF/HWP extraction is incomplete, display `공고문 원문 확인 필요` instead of inventing values.
- funding 금액은 공고문 공급금액/납부조건 표에서만. limits 인용은 실제 원문 문장만 — 값 추정 금지.

## Acceptance checklist

- [ ] `templates/result.html` exists and only the `window.__DATA__` block was edited.
- [ ] HTML opens locally without external build steps.
- [ ] 요청된 섹션만 보이고, 요청 안 된 섹션은 완전히 숨겨진다(빈 카드 노출 금지).
- [ ] Visible HTML contains no `DB크로스체크`, `근거대조`, or implementation debug labels.
- [ ] No leftover sample/test data (presale names, PDF figures, dates) from `references/` remains in `__DATA__`.
- [ ] Any backdata/XLSX review material is delivered separately from the user-facing HTML.

## Output structure

```txt
out/ipzitalk-read-notice-report/
  result.html
  backdata.xlsx        # 섹션 통합 1개 (원천파일·공급대상·공급금액·일정·제한사항·납부조건·DB크로스체크·검증결과·한계사항)
```

## 변경 이력

| 버전 | 날짜 | 내용 |
|---|---|---|
| 1.0.0 | 2026-07-09 | read-brief/read-dday/read-funding/read-limits 4개 스킬 통합. 공고 pin·PDF 추출·크로스체크 1회 공유, 섹션 토글(`__DATA__` 키 null=숨김), 백데이터 XLSX 1개로 통합. 템플릿 CSS 토큰은 4개 원본과 동일 유지 |


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

| 1.1.0 | 2026-07-13 | 브리핑 가격표 열 라벨 정정: `층구간 평균`→`주택형별 평균 분양가`, `최고 평당가`→`주택형별 평균 평당가`(값은 원래 세대수 가중평균이었으나 라벨이 최고가로 오기재됨). 표 아래 가중평균 기준 안내문 추가, 가중평균 산식·검산·백데이터 열 규칙 명문화 |
