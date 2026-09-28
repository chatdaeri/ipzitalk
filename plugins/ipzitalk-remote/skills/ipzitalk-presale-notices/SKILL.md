---
name: ipzitalk-presale-notices
description: >
  지역명 또는 주소를 입력받아 최근 청약홈 APT 모집공고를 HTML 보고서로 만든다.
  사용자가 보고서·리포트·HTML 작성을 명시적으로 요청할 때만 자동 활성화한다.
  일반적인 분양 질문이나 목록 요청에는 사용하지 않는다. 사용자가 이 스킬을 직접 호출하거나 이름을 지목해 실행을 지시하면 예외로 실행한다.
license: proprietary
metadata:
  version: "1.0.1"
---

# 지역 분양공고 보고서

확정한 지역의 최근 모집공고를 **가격 추정 없이** 공식 공고 필드로 정리한다. 반경·거리·주택형별 공급세대·지도는 제공하지 않는다.

## 활성화 게이트 🚨

- 자동 활성화는 대상 지역 또는 주소와 함께 `보고서`·`리포트`·`HTML` 중 하나의 작성·생성·출력을 명확히 요청한 경우만 허용한다.
- Claude Code의 `/ipzitalk-presale-notices`, Codex의 `$ipzitalk-presale-notices`, 클라이언트의 설치된 스킬 선택 기능으로 직접 호출하거나, 대화에서 이 스킬 이름을 지목해 실행을 명시적으로 지시한 경우(예: `ipzitalk-presale-notices 스킬로 경기도 의왕시 해줘`)는 위 표현이 없어도 실행한다. 일반 텍스트에서 스킬 이름을 언급하거나 스킬에 대해 질문한 것만으로는 직접 호출로 보지 않는다.
- 일반 분양 질문·목록·지도·비교 요청만으로는 자동 활성화하지 않는다.
- 게이트를 통과하지 못하면 MCP·웹·파일 호출, 일일 사용량 집계와 산출물 생성을 시작하지 않는다.

## Remote MCP 계약

입지톡 Remote MCP의 다음 기본 도구명(base tool name)만 사용한다.

- `get_address`
- `get_region_code`
- `search_presale_notices_by_filter`

연결된 도구 중 `ipzitalk-remote` 플러그인의 `ipzitalk` 서버 provenance가 확인되는 도구만 사용한다. Codex에서는 `server: ipzitalk`을 확인한다. provenance를 구조적으로 제공하지 않을 때만 다음 이름을 순서대로 확인한다.

1. `mcp__plugin_ipzitalk-remote_ipzitalk__<도구명>`
2. `mcp__ipzitalk_mcp__<도구명>`
3. `mcp__ipzitalk__<도구명>`
4. `mcp__claude_ai_ipzitalk__<도구명>`

`presale-mcp` 등 로컬 서버의 동명 도구를 대신 사용하지 않는다. 출처가 모호하거나 Remote MCP가 없으면 임의 선택하지 않고 중단한다.

모든 성공·오류 호출은 계정별 한국시간 기준 하루 500회에 포함되며 크레딧은 차감하지 않는다. `DAILY_TOOL_LIMIT_EXCEEDED`가 반환되면 재시도하지 않고 `내일 다시 사용 가능합니다.`라고 안내한다.

## 입력

| 파라미터 | 필수 | 기본 | 설명 |
|---|---|---|---|
| `query` | ✅ | - | 시군구·주소. 장소명만 있으면 후보 선택 후 주소로 확정 |
| `recent_months` | ✕ | 6 | 모집공고일 기준 최근 개월 수, 1~180 정수 |

명확한 지역명·주소는 `get_region_code(query)`로 해소한다. 장소명만 주어졌으면 `get_address` 후보를 보여주고 사용자 선택 전에는 다음 호출을 하지 않는다.

## 워크플로우

1. 출력 경로 `out/ipzitalk-presale-notices/`를 정하고 `audit.json` 기록을 시작한다.
2. `get_region_code`의 `applyhome_code`와 `region_name`에서 청약홈 공급지역 코드와 시군구 주소 필터를 확정한다. 세종처럼 시군구가 없는 지역은 시도명을 주소 필터로 쓴다.
3. 한국시간 오늘을 `date_to`, 달력 기준 `recent_months`개월 전을 `date_from`으로 계산한다.
4. `search_presale_notices_by_filter(subscrpt_area_code=applyhome_code, apply_address=확정지역, date_from, date_to, page=1, limit=50)`을 호출한다.
5. `pagination.has_more=true`이면 같은 필터로 `pagination.next_page`를 이어 호출해 기간 내 전량을 자동 수집한다. 일부 페이지가 실패하면 확보한 결과를 유지하되 `pagination.complete=false`로 기록한다.
6. `(house_manage_no, pblanc_no)`로 중복 제거하고 `rcrit_pblanc_de` 내림차순, `house_nm` 오름차순으로 정렬한다.
7. 서버가 반환하지 않은 좌표·거리·주택형·가격·상태는 추정하지 않는다.

## 표시 계약

- 표시 필드: 공고명, 주택구분, 공급위치, 모집공고일, 입주예정월, 총공급세대, 공식 원문 링크.
- 총공급세대 합계는 값이 확인된 공고만 더하고 누락 건수를 함께 표시한다.
- `pblanc_url`은 서버가 반환한 HTTPS URL만 그대로 사용하며 링크를 추측해 조립하지 않는다.
- 입주월이 조회일과 같거나 이전이면 `입주 예정`이라고 쓰지 않는다.
- 분양가·평당가·가격 비교를 요청·계산·표시하지 않는다.

## 산출물

1. `out/ipzitalk-presale-notices/result.json`: `references/data-schema.md` 및 `templates/result.html`의 `templateDataShape`와 같은 내부 계약용 고정 이름 데이터.
2. `out/ipzitalk-presale-notices/audit.json`: `skillBaseDirectory`, `dailyToolLimit:500`, 호출별 `baseToolName`·`provenance`·`resultCount`·`hasMore`·`page`·`nextPageUsed`, 전체 `skillCallCount`·`pageCallCount`·`quotaError`, `shellUsed`, `webUsed`, `generatedFiles`. 당일 계정 전체 누적 사용량은 추정하지 않는다.
3. `<정규화지역>_최근분양공고.html`: 고정 템플릿의 비실행 `ipzi-data` JSON 블록만 교체한 사용자 파일.

셸 사용이 허용되면 스킬에 포함된 `scripts/html_artifact_contract.mjs`를 `--file-name "<정규화지역>_최근분양공고"`와 함께 사용한다. shell-free 또는 셸 금지 환경에서는 JSON 블록만 교체하고 fixed template region(고정 영역)이 원본과 같은지 확인한다.

템플릿의 마크업·CSS·렌더 JS는 실행 중 수정하지 않는다. validator 검증기가 통과하기 전에는 완료 처리하지 않는다. `generatedFiles`에는 실제 최종 파일명과 경로를 기록하고 최종 응답은 `audit.json` 기준으로 작성한다.

## 실패 처리

| 상황 | 처리 |
|---|---|
| 지역 후보 다수 | 후보 선택 전 검색 중단 |
| `applyhome_code` 없음 | 지역 재입력 요청 |
| 공고 0건 | `최근 6개월 확인된 모집공고 없음` 표시 |
| 추가 페이지 실패 | 부분 결과와 실패 페이지를 표시하고 전량 표현 금지 |
| `DAILY_TOOL_LIMIT_EXCEEDED` | 우회·반복 호출 없이 부분 결과를 유지하고 `내일 다시 사용 가능합니다.` 안내 |

## 변경 이력

| 버전 | 날짜 | 내용 |
|---|---|---|
| 1.0.1 | 2026-09-23 | Claude·Codex 직접 호출 표기, 대화 내 스킬 지목 실행 지시의 직접 호출 인정, 표준 metadata, 자체 포함 HTML 렌더러 계약 반영 |
| 1.0.0 | 2026-09-23 | PR #175 최종 공개 계약에 맞춰 반경 스킬을 최근 6개월 지역 공고 보고서로 전환 |
