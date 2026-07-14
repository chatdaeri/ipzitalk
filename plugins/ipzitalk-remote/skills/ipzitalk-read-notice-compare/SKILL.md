---
name: ipzitalk-read-notice-compare
description: "모집공고 2~4개를 공고문 원문 기준으로 비교한다. 청약 일정 겹침 캘린더·계약금/중도금/잔금 납부조건·전매제한/거주의무/재당첨제한·축별 비교표를 한 장 HTML로 낸다. '공고 비교', 'A 공고랑 B 공고 비교', '어느 청약부터 넣을까', '청약 일정 겹쳐?' 등의 표현이 있으면 이 스킬을 사용한다. 단지 자체(DB 기준 분양가·세대·입주월) 비교는 ipzitalk-presale-compare-card, 공고 1개 정리는 ipzitalk-read-notice-report."
version: 1.1.2
author: Synergy Labs + Hermes Agent
license: proprietary
metadata:
  hermes:
    tags: [ipzi-talk, presale, html-template]
    created_by: agent
---

# ipzitalk-read-notice-compare 공고 비교 (조립 · L2)

> tier: L2

모집공고 2~4개를 **공고문 원문 조건**으로 나란히 비교한다.
ipzitalk-presale-compare-card(청약홈 DB 기준 단지 비교)와 역할이 다르다 — 이 스킬은 공고문에서만 나오는
**일정 충돌 · 납부조건(계약금/중도금/잔금, 무이자 여부) · 제한사항(전매/거주의무/재당첨)** 이 핵심이다.
종합 우열은 단정하지 않고 축별 우위만 표시한다(가중치=사용자 몫).

## 입력

| 파라미터 | 필수 | 기본 | 설명 |
|---|---|---|---|
| 공고 2~4개 | ✅ | - | 청약 공고명 또는 청약홈 상세 URL. 1개면 ipzitalk-read-notice-report로 안내 |
| `exclusive_area_sqm` | ✕ | 84 | 가격·자금 비교 기준 전용타입(같은 타입끼리) |

> 공고명이 여러 공고에 매칭되면 후보 제시 후 선택(자동 확정 금지).
> 공식 모집공고문 PDF/HWP를 공고마다 확보해야 한다. 한쪽이라도 실패하면 해당 축은 `공고문 원문 확인 필요`.

## Default test input

```txt
안양 에버포레 자연앤 e편한세상(A2BL) vs 평촌 자이 퍼스니티, 84 기준
```

## 조립 방식 (방법1 · 복사본)

스킬 간 호출은 불가하다. ipzitalk-read-notice-report를 부르지 않고, **`references/notice-pipeline.md` 복사본을 읽어**
공고마다 추출 파이프라인(pin → PDF 확보 → 텍스트 추출 → 구조화 → DB 크로스체크)을 이 실행 안에서 수행한다.

## MCP 도구 선택과 출처

- 접두사 없는 도구 이름은 **기본 도구명(base tool name)** 이다. 연결된 도구 목록에서 같은 기본 도구명을 찾고, **`ipzitalk-remote` 플러그인의 `ipzitalk` 서버 provenance**가 확인되는 도구만 우선 사용한다. Codex에서는 실제 호출 이벤트의 `server: ipzitalk`과 기본 도구명을 함께 확인한다.
- `presale-mcp` 또는 다른 로컬 MCP provenance의 동명 도구는 Remote Skill의 대체 수단으로 사용하지 않는다. provenance를 확인할 수 없거나 같은 기본 도구명이 여러 서버에 있어 모호하면 임의 선택하지 말고 중단한다.
- provenance를 구조적으로 확인할 수 없을 때만 `mcp__plugin_ipzitalk-remote_ipzitalk__<도구명>`, `mcp__ipzitalk_mcp__<도구명>`, `mcp__ipzitalk__<도구명>`, `mcp__claude_ai_ipzitalk__<도구명>` 순서의 명시적 fallback을 확인한다. fallback으로도 Remote 출처가 유일하지 않으면 중단한다.
- 공고 pin·원문 확보·구조화에 필요한 구체적인 도구와 실행 순서는 `references/notice-pipeline.md`의 **MCP 도구 네임스페이스와 출처** 절을 포함해 읽고 따른다.

## 워크플로우

1. **공고 pin** — 입력에 `house_manage_no`가 있으면 이름 검색보다 관리번호를 우선해 결과를 필터링하고 `announcement_id`를 확정한다. 후보 다수 → 선택.
   - 관리번호가 없으면 공백·지역 접두어·브랜드 표기를 정규화한 공고명으로 조회한다.
   - 정확명 0건이면 지역과 정규화 공고명을 함께 쓰는 fallback만 수행한다. `에피트` 같은 광역 공통 브랜드명 단독 검색은 금지한다.
   - 기대 관리번호 없이 fallback 결과가 여러 개면 자동 선택하지 않는다.
   - 감사 로그에는 **시도 횟수와 성공 pin 횟수를 분리**해 기록한다. `공고마다 1회`는 성공 pin 수가 아니라 실제 MCP 시도 예산과 혼동하지 않는다.
2. **공고별 추출** — `references/notice-pipeline.md`대로 PDF 확보·pdftotext·구조화·크로스체크. **공고당 1회만, 재추출 금지.**
3. **기준 타입 정렬** — 요청 전용타입(기본 84)에 속하는 **모든 주택형 전체**를 비교 단위로 삼는다(A/B/C/D 중 하나만 고르지 않는다).
   공통 타입이 없으면 **최대 공통 전용타입으로 하향**, 그것도 없으면 가격·자금 축은 비교하지 않고 그 사실을 화면에 쓴다.
   - 🚨 **가격 축은 전용타입 전체 세대수 가중평균으로 낸다.**
     `전용84 평균 분양가 = Σ(모든 84 주택형의 층구간 세대수 × 층구간 공급금액) ÷ 84 총세대수`
     `전용84 평균 평당가 = Σ(층구간 세대수 × 층구간 평당가) ÷ 84 총세대수` (주택형마다 공급면적이 다르므로 평당가를 먼저 구해 세대수로 가중한다)
     최고가 주택형 1개만 뽑아 대표값으로 쓰지 않는다 — 소수 세대 타입이 단지를 대표하는 편향을 막기 위함.
   - 자금(②) 스택바의 금액 기준만 **전용타입 내 최다 세대수 주택형의 최고 층구간 공급금액**을 쓰고, 그 사실을 `basis`에 명시한다(납부표는 세대별 금액이라 평균으로 낼 수 없다).
4. **축 구성**
   - ① 일정 겹침: 공고별 특공/1순위/발표/서류/계약 날짜를 캘린더로. **같은 날 청약 겹침은 경고**로 명시.
   - ② 자금 부담: 계약금/중도금/잔금 비율 스택바 + 초기 필요 현금. 중도금 무이자/이자후불 표기.
   - ③ 제한사항: 전매제한·거주의무·재당첨제한. 원문 문장 인용 첨부.
   - ④ 축별 비교표: 전용타입 **평균 분양가·평균 평당가(세대수 가중)** · 최고 분양가 · 공급규모 · 입주월 등.
     가격 row의 label에는 `평균`을 명시한다(e.g. `84㎡ 평균 평당가(세대수 가중)`).
5. **렌더** — 고정 템플릿 `templates/result.html`의 비실행 `ipzi-data` JSON 블록에 데이터를 주입. 섹션 키 null=숨김.
6. **백데이터** — XLSX 1개: 공고별 시트(notice-pipeline 시트 구성) + `가중평균검증` 시트 + `비교` 시트(축·값·우위·근거).
   - `가중평균검증` 시트는 공고별로 전용타입 내 **모든 주택형 × 층구간** 행(주택형·층별·세대수·공급금액·평당가)을 그대로 싣고,
     맨 아래에 `세대수합`, `Σ(세대수×공급금액)`, `평균 분양가`, `Σ(세대수×평당가)`, `평균 평당가` 행을 둬 손으로 검산 가능하게 한다.
   - 세대수합이 공고 전용타입 총세대수와 일치하지 않으면 가격 축을 `공고문 원문 확인 필요`로 둔다.

### XLSX 산출물 계약 🚨
- 먼저 `out/ipzitalk-read-notice-compare/backdata.json`을 `{ "sheets": [{ "name": "...", "columns": [...], "rows": [[...]] }] }` 구조로 만든다. 셀 값은 문자열·숫자·불리언·null만 허용한다.
- 셸 사용이 허용된 환경에서는 스킬 기준 `../../scripts/xlsx_artifact.py`를 사용한다: `python3 <script> --input out/ipzitalk-read-notice-compare/backdata.json --output out/ipzitalk-read-notice-compare/backdata.xlsx`.
- 생성 직후 같은 스크립트의 `--check`와 `--require-sheet 가중평균검증 --require-sheet 비교` 및 공고별 필수 시트 이름으로 ZIP 무결성·시트 구성을 검증한다.
- 생성기는 Python 표준 라이브러리만 사용한다. `openpyxl` 등 패키지 설치 시도는 금지한다. 생성기가 없거나 실행할 수 없으면 임시 Python 생성기를 새로 쓰지 말고 `backdata.xlsx`를 완료 처리하지 않는다.
- `shell-free` 또는 셸 금지 환경에서는 바이너리 XLSX 생성이 허용되지 않은 것이므로 HTML만 완료하고, XLSX 미생성과 이유를 명시한다.

## 공정성 규칙 (ipzitalk-presale-compare-card에서 승계)

- **같은 전용타입 기준.** 다른 평형 비교 금지. 공통 없으면 하향, 그것도 없으면 유보 명시.
- 🚨 **공고일 차이가 6개월 이상이면 가격·평당가 축의 `winner`를 `null`로 둔다.** 색칠하지 않고 시점 차이를 경고로 명시한다.
  (시세·정책 반영 시점이 달라 격차가 단지 우열인지 구분 불가 — 잠실 르엘 vs 래미안아이파크 실측 근거.)
- **시점과 무관하게 확정되는 축만 우위 표시** — 일정(빠를수록/겹침 없음), 초기 현금(낮을수록), 거주의무·전매(짧을수록), 세대수(클수록). 중도금 무이자 여부는 우위가 아니라 사실 표기.
- **종합 우열 단정 금지.** 템플릿 푸터에 "가중치는 사용자 몫" 고정.
- 결측은 `정보없음` 또는 `공고문 원문 확인 필요`(0으로 채우지 않는다). 값 추정 금지.

## HTML template

- Included template: `templates/result.html`
- Sample input/backdata: `references/sample-input.json`, field reference: `references/data-schema.md`
- The template is **fixed**: markup, CSS, and rendering JS never change between runs. The only edit is the non-executable `ipzi-data` JSON block. Do not add/remove HTML elements or touch the render function.
- Layout: hero(VS 헤더, 팀색 A파랑·B빨강·C보라·D청록 자동) → ①일정 겹침 캘린더 → ②자금 부담 스택바 → ③제한사항 비교표+원문 인용 → ④축별 비교표 → 푸터. `notices`가 2개 미만이면 본문 섹션 전체 숨김.

### HTML 산출물 계약 🚨
- 최종 HTML은 반드시 `out/ipzitalk-read-notice-compare/result.html`에 저장하고 다른 스킬의 공유 `result.html`을 덮어쓰지 않는다.
- 셸 사용이 허용된 환경에서는 스킬 기준 `../../scripts/html_artifact_contract.mjs` 검증기를 사용한다. `--skill-dir`에는 이 스킬의 base directory, `--data`에는 완성한 JSON 파일, `--output-root`에는 작업공간의 `out` 디렉터리를 전달한다.
- `shell-free` 또는 셸 금지 환경에서는 File Read/Write로 `templates/result.html`을 직접 읽고 `ipzi-data` JSON 블록만 교체한다. 교체 전후의 fixed template region(고정 영역: 데이터 블록 앞 prefix와 뒤 suffix)이 원본과 같은지 비교한다.
- 검증기가 통과하기 전에는 완료로 주장하지 않는다. File Read/Write나 고정 영역 비교를 수행할 수 없거나 금지된 도구를 사용했다면 완료 처리하지 말고 제약과 실제 사용 도구를 보고한다.

## User-facing HTML rules

- Use product name **Ipzi Talk**.
- Use user-facing wording such as `모집공고문 기준`, `청약홈 기준`, `자료 기준`, `확인 필요`.
- Do not show internal implementation/debug wording; keep DB cross-check details in XLSX/backdata only.
- 제한사항 인용은 실제 공고문 원문 문장만 — 값 추정 금지.

## Acceptance checklist

- [ ] `templates/result.html` exists and only the `ipzi-data` JSON block was edited.
- [ ] HTML opens locally without external build steps.
- [ ] 공고 2개 미만이면 비교 섹션이 렌더되지 않는다.
- [ ] 공고일 6개월 이상 차이인데 가격 축에 우위(●/색칠)가 표시된 곳이 없다.
- [ ] 가격 축이 전용타입 전체 세대수 가중평균이고(최고가 1개 주택형 대표값 아님), backdata `가중평균검증` 시트로 재계산이 검증된다.
- [ ] 종합 우열 문구가 없다("가중치는 사용자 몫" 푸터 유지).
- [ ] Visible HTML contains no `DB크로스체크`, `근거대조`, or implementation debug labels.
- [ ] No leftover sample/test data from `references/` remains in `ipzi-data`.
- [ ] backdata.xlsx에 공고별 시트 + 비교 시트가 있고 real XLSX zip이다.

## Output structure

```txt
out/ipzitalk-read-notice-compare/
  result.html
  backdata.xlsx        # 공고별 시트(원천파일~한계사항) + 비교 시트
```

## 변경 이력

| 버전 | 날짜 | 내용 |
|---|---|---|
| 1.0.0 | 2026-07-09 | 신규 작성. ipzitalk-read-notice-report 추출 파이프라인을 `references/notice-pipeline.md` 복사본으로 승계(공고당 1회 실행), ipzitalk-presale-compare-card의 공정성 규칙(같은 전용타입·공고일 6개월 룰·종합 우열 금지) 승계. 고유 축 = 일정 겹침·납부조건·제한사항 |
| 1.1.0 | 2026-07-13 | 가격 축을 전용타입 **전체 세대수 가중평균**으로 변경(기존: 최고가 주택형 1개 대표값 → 소수 세대 타입이 단지를 대표하는 편향). 백데이터에 `가중평균검증` 시트 추가, 자금 축 기준을 최다 세대수 주택형으로 명시 |
| 1.1.1 | 2026-07-14 | Remote MCP 도구의 base-name·plugin/server provenance·로컬 제외·모호성 중단 규칙을 SKILL 본문에 명시하고 상세 pipeline reference를 유지 |
| 1.1.2 | 2026-07-14 | 관리번호 우선·지역+정규화명 fallback·pin 시도/성공 분리 감사, 고유 HTML·비실행 JSON 렌더, 표준 라이브러리 XLSX 생성·검증 계약 추가 |
