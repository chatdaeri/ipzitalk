---
name: ipzitalk-complex-overview-all
description: >
  아파트명 또는 소재 주소 하나의 K-apt 기본정보, 교통·생활·교육 입지, 인근 아파트,
  지역 최근 분양 공고를 종합한 HTML 보고서를 만든다. 사용자가 보고서·리포트·HTML 작성을
  명시적으로 요청할 때만 자동 활성화한다. 단순한 어때·알려줘·정리해줘·분석해줘·
  한눈에 보기 요청에는 사용하지 않는다. 사용자가 이 스킬을 직접 호출하거나 이름을 지목해 실행을 지시하면 예외로 실행한다.
license: proprietary
metadata:
  version: "3.0.1"
---

# 이 아파트 한눈에 보기

아파트 하나를 입력받아 **단지 기본정보 + 교통·생활·교육 + 인근 아파트 5곳 + 지역 최근 분양공고 + 지도**를 한 장 HTML로 만든다.

실거래가·매매·전세·분양권·평당가·분양가는 제공하지 않는다. 조회 결과에 없는 값은 추정하지 않고 `확인되지 않음`으로 둔다.

## 활성화 게이트 🚨

- 자동 활성화는 대상 단지와 함께 `보고서`·`리포트`·`HTML` 중 하나를 사용해 작성·생성·출력 의사를 명확히 밝힌 경우만 허용한다.
- Claude Code의 `/ipzitalk-complex-overview-all`, Codex의 `$ipzitalk-complex-overview-all`, 클라이언트의 설치된 스킬 선택 기능으로 직접 호출하거나, 대화에서 이 스킬 이름을 지목해 실행을 명시적으로 지시한 경우(예: `ipzitalk-complex-overview-all 스킬로 잠실 리센츠 해줘`)는 위 표현이 없어도 실행한다. 일반 텍스트에서 스킬 이름을 언급하거나 스킬에 대해 질문한 것만으로는 직접 호출로 보지 않는다.
- 단순 질문·요약·분석·비교·추천, `한눈에 보기`·카드·대시보드·브리핑 요청, 부정문·가정문·용어 언급은 자동 활성화 근거가 아니다.
- 게이트를 통과하지 못하면 MCP 호출·일일 사용량 집계·파일 생성을 시작하지 않는다.

## Remote MCP 계약

입지톡 Remote MCP에서 다음 기본 도구명만 허용한다.

- `get_geocode`
- `get_address`
- `get_region_code`
- `search_by_nearby_category`
- `search_by_nearby_keyword`
- `find_complexes_near_point`
- `get_complex_info_by_query`
- `search_presale_notices_by_filter`
- `get_map_embed_url`

먼저 연결된 도구 목록에서 기본 도구명을 찾고 `ipzitalk-remote` 플러그인의 `ipzitalk` 서버 provenance가 확인되는 도구만 사용한다. Codex에서는 호출 이벤트의 `server: ipzitalk`과 기본 도구명을 확인한다. provenance를 구조적으로 제공하지 않을 때만 다음 순서로 확인한다.

1. `mcp__plugin_ipzitalk-remote_ipzitalk__<도구명>`
2. `mcp__ipzitalk_mcp__<도구명>`
3. `mcp__ipzitalk__<도구명>`
4. `mcp__claude_ai_ipzitalk__<도구명>`

`presale-mcp` 등 다른 로컬 서버의 동명 도구는 사용하지 않는다. 출처가 모호하거나 Remote MCP가 연결되지 않았으면 웹 검색·모델 지식으로 대체하지 말고 중단한다.

모든 성공·오류 호출은 계정별 한국시간 기준 하루 500회에 포함되며 크레딧은 차감하지 않는다. `DAILY_TOOL_LIMIT_EXCEEDED`가 반환되면 재시도하지 않고 `내일 다시 사용 가능합니다.`라고 안내한다.

## 입력

| 파라미터 | 필수 | 기본 | 설명 |
|---|---|---|---|
| `target` | ✅ | - | 아파트명 또는 소재 주소 |
| `poi_radius_m` | ✕ | 2,000m 수집 / 1,000m 표시 | 교통·생활·교육 표시 범위 |
| `complex_radius_km` | ✕ | 2km | 인근 아파트 검색 범위, 0.1~20km |

## 워크플로우

### 1. 기준 단지 확정

1. `get_complex_info_by_query(complex_query=target)`로 단지명·공식 주소·K-apt 기본정보를 확정한다.
2. 후보가 모호하면 MCP를 더 호출하지 말고 후보를 제시해 사용자 선택을 받는다.
3. 응답의 도로명주소를 우선해 `get_region_code`를 한 번 호출하고 좌표·`applyhome_code`·정규화 지역을 함께 확정한다. 좌표가 없을 때만 같은 공식 주소로 `get_geocode`를 한 번 호출한다. 공식 주소가 없을 때만 `get_address(query=확정 단지명)` 후보를 사용한다.
4. 좌표·단지명이 확정되지 않으면 중단한다.

`PRESALE_ROUTING_REQUIRED` 또는 K-apt 미등록 결과면 이 보고서를 만들지 않고 `ipzitalk-presale-notices`로 지역 분양공고를 조회하도록 안내한다.

표시 가능한 기본정보는 응답에서 확인된 값으로 한정한다: 세대수, 동수, 사용승인일, 시공사, 시행사, 난방방식, 복도유형, 최고층, 전용면적 구간별 세대수, 도로명·지번주소.

### 2. 교통·생활·교육

- `search_by_nearby_category` 1회: `school_elementary`, `school`, `subway`, `mart_large`.
- `search_by_nearby_keyword` 최대 4회: 공원, 도서관, 백화점, 종합병원.
- 2km에서 수집하고 표에는 1km 안의 결과를 우선 표시한다. 지하철은 1km 밖이어도 최근접 1곳을 표시한다.
- 카테고리 source cap이나 keyword `has_more`가 있으면 전수 결과라고 표현하지 않는다.
- 직선거리이며 학군·배정·도보 동선을 뜻하지 않는다는 단서를 유지한다.

### 3. 인근 아파트 5곳

1. `find_complexes_near_point(center_lat, center_lng, radius_km=complex_radius_km, sort="distance", limit=50)`를 한 번 호출한다.
2. 도구가 반환한 거리순을 사용하되 기준 단지와 이름·주소 중복을 제외한다.
3. 남은 후보 중 상위 5곳의 이름·주소·거리·세대수·사용승인일을 finder 결과에서 그대로 사용한다. 후보별 추가 상세 조회는 하지 않는다.
4. 인근 단지의 가격·거래·우열은 비교하지 않는다.

`find_complexes_near_point`의 `results`만 인근 단지 후보로 사용한다. `pagination.has_more=true`여도 상위 5곳 선정에 첫 50건이면 충분하므로 `next_cursor`를 이어 호출하지 않고 `첫 페이지 기준`이라고 기록한다. 도구가 노출되지 않았거나 필수 좌표·단지명·거리 필드가 없으면 해당 섹션을 `확인되지 않음`으로 두고 임의 스키마를 만들지 않는다.

### 4. 지역 최근 분양공고

- 한국시간 오늘과 6개월 전 날짜를 계산하고 `search_presale_notices_by_filter(subscrpt_area_code=applyhome_code, apply_address=확정 시군구, date_from, date_to, page=1, limit=50)`을 호출한다.
- `pagination.has_more=true`이면 같은 필터로 `pagination.next_page`를 자동으로 이어 기간 내 전량을 수집한다. 일부 페이지가 실패하면 부분 결과임을 표시한다.
- `(house_manage_no, pblanc_no)`로 중복 제거하고 공고일 내림차순·공고명 오름차순으로 정렬한 뒤 최신 5건만 표시한다. `지역·최근 6개월 기준, 전체 N건 중 5건`처럼 전체와 표시 건수를 함께 밝힌다.
- 표시 필드: 공고명, 공급위치, 공고일, 입주월, 총공급세대, 공식 상세 링크.
- 가격 필드는 요청·계산·표시하지 않는다.
- 주택형·거리·좌표·파생 상태는 만들지 않는다.
- 입주월이 조회일과 같거나 이전이면 `입주 예정`이라고 쓰지 않는다.

### 5. 지도

- `get_map_embed_url`을 정확히 한 번 호출한다.
- 기준 단지, 각 입지 축의 최근접 장소, 인근 단지만 마커로 넣는다. 지역 분양공고는 좌표가 없어 마커로 만들지 않는다.
- 반경을 맞추기 위한 가짜 마커를 만들지 않는다.
- 반환 URL 전체를 `map.url`에 그대로 저장한다. scheme·host·path·query·지도 ID를 바꾸지 않는다.
- 링크는 7일 후 만료될 수 있음을 결과물에 표시한다.

## 결과물 계약

MCP 호출 전에 `out/ipzitalk-complex-overview-all/`을 정하고 다음 순서로 만든다.

1. `out/ipzitalk-complex-overview-all/result.json`: `templates/result.html`의 `templateDataShape`와 동일한 내부 계약용 고정 이름 데이터.
2. `out/ipzitalk-complex-overview-all/audit.json`: 호출별 `baseToolName`, 입력 요약, `resultCount`, `truncated`, `provenance`, `reason`, `hasMore`와 전체 `skillBaseDirectory`, `shellUsed`, `webUsed`, `generatedFiles`.
3. `out/ipzitalk-complex-overview-all/<단지명>_한눈에보기.html`: 고정 템플릿의 `ipzi-data` JSON 블록만 교체한 사용자 산출물.

`result.json`과 `audit.json`은 내부 계약의 고정 이름을 유지하고 바꾸지 않는다.

셸 사용이 허용되면 스킬에 포함된 `scripts/html_artifact_contract.mjs`를 `--file-name "<단지명>_한눈에보기"`와 함께 사용한다. shell-free 환경에서는 JSON 블록만 교체하고 앞뒤 고정 영역이 원본과 같은지 확인한다.

템플릿의 데이터 경계 밖 마크업·CSS·렌더 JS를 실행 중 수정하지 않는다. validator 검증기가 통과하기 전에는 완료로 처리하지 않는다. `generatedFiles`에는 실제 최종 파일명과 경로를 기록하고, 최종 응답은 `audit.json` 기준으로 실제 호출과 생성 파일을 보고한다.

## 분석 목적 맞춤 요약

- 사용자가 목적을 밝혔으면 그 문장을 `goal.purpose`에 그대로 보존한다.
- 목적이 없고 네이티브 사용자 입력 UI가 있으면 `4인가족 실거주 검토`, `투자 심의 회의 자료`, `분양 제안서용 자료`, `건너뛰기`를 제시하고 기타 직접 입력도 허용한다.
- UI가 2~3개 선택지만 지원하면 지원 가능한 수만큼 앞에서부터 프리셋을 제시하고 직접 입력으로 `건너뛰기`도 받을 수 있다고 알린다.
- 네이티브 UI가 없거나 직접 입력을 지원하지 않으면 `원하는 분석 목적을 한 문장으로 알려주세요. 건너뛰셔도 됩니다.`라는 다음 질문만 출력하고 그 턴을 종료한다.
- 목적 또는 건너뛰기 응답 전에는 MCP를 호출하지 않는다. 프리셋·직접 입력의 문구와 원문은 그대로 저장한다.
- 건너뛰면 `goal:null`로 두고 목적 섹션 없이 진행하며 목적을 지어내지 않는다.
- 데이터 수집 완료 후에만 `conclusions`, `evidence`, `cautions`, `nextActions`를 작성한다. `purpose`는 사용자 표현 그대로 보존하고 새 데이터나 없는 수치를 만들지 않는다.

## 실패 처리

| 상황 | 처리 |
|---|---|
| 단지 후보 다수 | 후보를 제시하고 선택 전 호출 중단 |
| 단지 또는 좌표 해소 실패 | 재입력 요청 |
| 입지 축 0건 | 잘림·cap 여부를 확인해 `반경 내 확인되지 않음` 또는 `검색 한계` 표시 |
| 인근 단지 도구 미노출 | 섹션을 `확인되지 않음`으로 두고 사유 기록 |
| 지역 분양공고 0건 | `최근 6개월 해당 지역에서 확인된 모집공고 없음` 표시 |
| 지도 발급 실패 | 지도 없이 나머지 보고서를 만들고 실패 코드 기록 |
| `DAILY_TOOL_LIMIT_EXCEEDED` | 재시도·우회 없이 확보한 부분 결과를 유지하고 `내일 다시 사용 가능합니다.` 안내 |

## 변경 이력

| 버전 | 날짜 | 내용 |
|---|---|---|
| 3.0.1 | 2026-09-23 | Claude·Codex 직접 호출 표기, 대화 내 스킬 지목 실행 지시의 직접 호출 인정, 표준 metadata, 자체 포함 HTML 렌더러 계약 반영 |
| 3.0.0 | 2026-09-23 | PR #175 최종 공개 계약에 맞춰 K-apt 인근 조회와 최근 6개월 지역 공고 조회로 전환 |
| 2.0.1 | 2026-09-23 | PR #175의 복수형 근접 단지 도구명·일일 500회·고정 50행 계약 반영 |
| 2.0.0 | 2026-09-23 | 8개 Remote MCP 도구 체계로 축소. 실거래·가격 제거, 기본정보·입지·인근 5곳·주변 분양 중심으로 재구성 |
| 1.1.10 | 2026-09-18 | 기존 실거래·입지·인근단지 종합 계약 |
