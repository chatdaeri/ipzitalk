---
name: ipzitalk-parking-ranking
description: >
  기준 주소·단지명·지역 주변 반경의 K-apt 단지를 수집하고, 세대당 주차대수 기준으로 랭킹을 만든다.
  "주차 좋은 단지", "세대당 주차", "주차 랭킹", "이 지역 아파트 주차 비교"를 물을 때 사용한다.
  enrich_complex_info의 parking_total과 get_complex_info(detail)의 derived.parking_per_unit을 함께 활용한다.
version: 1.0.4
license: proprietary
---

# 주차 랭킹

> tier: L1

반경 내 K-apt 매칭 단지의 `parking_total / total_units` 또는 `derived.parking_per_unit`으로 세대당 주차 랭킹을 만든다.

## 입력
| 파라미터 | 필수 | 기본값 | 설명 |
|---|---|---|---|
| `target` | ✅ | - | 기준 주소/단지명/지역명/법정동코드 |
| `radius_m` | ✕ | `2000` | 후보 수집 반경 |
| `limit` | ✕ | `20` | 후보 단지 수 |
| `detail_threshold` | ✕ | `필요시` | enrich 값 부족 단지만 detail 보강 |

## 필수 도구
| 도구 | 용도 |
|---|---|
| `resolve-site` 규약 | 기준점 좌표·코드 확보 |
| `search_by_nearby_keyword(preset="apartment", grid=true)` | 후보 단지 수집 |
| `enrich_complex_info` | K-apt 매칭 + parking_total/total_households 1차 확보 |
| `get_complex_info(detail=true)` | 주차 지상/지하 및 derived.parking_per_unit 보강 |
| `get_map_embed_url` | 랭킹 지도 생성 |

## 워크플로우
1. **기준점 해소** — 주소/단지명은 exact, 지역/코드는 area_center 경고.
2. **후보 수집** — `search_by_nearby_keyword(..., preset="apartment", grid=true)`.
3. **1차 enrich** — `enrich_complex_info`로 `parking_total`, `total_households`, `use_approval_date` 확보.
4. **세대당 주차 계산**
   - 🚨 `derived.parking_per_unit`을 **그대로 믿지 말 것.** 서버가 `(parking_ground ?? 0) + (parking_underground ?? 0)`로
     계산해서, **한쪽만 결측이면 그 값을 0으로 흡수**해 조용히 과소 산출한다.
   - 따라서 `get_complex_info(detail=true)`의 **원값 `parking_ground`·`parking_underground`를 직접 확인**한다.
     - 둘 다 숫자 → 합계로 세대당 주차 계산 (`derived.parking_per_unit`과 일치해야 정상).
     - **하나라도 `null` → 판정 유보**(`자료없음`). 합산 금지.
   - enrich만 있을 때는 `parking_total / total_households` 계산.
   - `parking_total=0` 또는 null은 실제 0인지 결측인지 확인 전까지 랭킹 제외 또는 `자료없음`.
5. **랭킹** — 세대당 주차 내림차순. 동점은 세대수/거리 보조 표시.
   - 입력이 단지명/단지 주소이고 해당 단지가 랭킹 후보에 포함되면 순위표 행을 `검색 기준`으로 강조한다.
   - 해당 단지가 주차값 결측으로 랭킹에서 제외되면, 순위표와 별도로 `검색 기준 단지: 자료없음/제외 사유` 카드를 표시한다.
6. **지도/출처/결측 수 표기**.

## 데모에서 확인한 파라미터
- 입력: `방배롯데캐슬아르떼`, 반경 2km
- 방배롯데캐슬아르떼: 1.57대/세대, 표본 내 상위권
- 표본 1위: 이수자이 주상복합 1.97대/세대
- 스타팰리스 이수는 detail 주차값 null, enrich parking_total=0 → 실제 0이 아니라 결측으로 처리
- 레이아웃 기준: `templates/result.html`

## 출력 포맷
- 랭킹 바: 순위, 단지명, 기준점 직선거리, 사용승인연도, 세대당 주차.
- 검색 기준 단지가 랭킹에 포함되면 해당 행은 강조 배경/테두리와 `검색 기준` 라벨을 붙인다.
- 오른쪽 요약 카드: 기준 단지 순위·주차대수·세대당 주차 → 그 아래 **상위 3개 단지**를 함께 싣는다.
  왼쪽 랭킹이 길어 오른쪽이 비어 보이는 걸 메운다. 상위 3개는 템플릿이 `ipzi-data.rows` 에서 직접 잘라 쓴다.
  🚨 **별도 데이터 필드를 만들지 말 것.** 따로 채우면 왼쪽 표와 숫자가 어긋난다.
- 지도: 기준 단지 + 랭킹 단지.
- **표본 범위 · 제외 단지는 독립 카드**(`#scope-card`)로 낸다. 지도 아래, 푸터 위.
  - 🚨 **푸터의 유의사항·출처와 `<br>` 로 이어붙이지 말 것.** 예전엔 그렇게 했고,
    "어느 단지가 왜 빠졌는가"가 잡문에 묻혀 보이지 않았다.
  - **표본에서 빠진 단지는 사용자의 판단을 바꾸는 정보다.** 표본 수를 인용할 때 반드시 함께 보인다.
  - `excluded` 가 비고 `sampleNote` 도 없으면 카드째 숨는다(전수 랭킹이면 표시할 게 없다).
- 화면 표기는 사용자용 용어만: 출처는 `공동주택관리정보시스템(K-apt)` · `카카오맵` · `네이버 지도`.
  내부 필드명(주차 원값 등)은 화면에 노출하지 않는다.

## HTML 산출물 계약 🚨

- 먼저 완성한 렌더 데이터만 `result.json`에 저장한다. 사용자 전달 HTML은 고정 정본 `templates/result.html`로 렌더하며, 마크업·CSS·렌더 JS는 손대지 않는다.
- 셸 사용이 허용된 환경에서는 스킬 기준 `../../scripts/html_artifact_contract.mjs`를 `--file-name "<기준대상>_주차랭킹"`과 함께 사용한다. 최종 파일명은 `<기준대상>_주차랭킹.html`이며 공용 렌더러가 경로 문자·예약문자·길이를 안전화한다.
- `shell-free` 또는 셸 금지 환경에서는 File Read/Write로 `templates/result.html`을 읽고 비실행 `ipzi-data` JSON 블록만 교체한다. 교체 전후의 fixed template region(고정 영역: 데이터 블록 앞 prefix와 뒤 suffix)이 원본과 같은지 비교한다.
- 템플릿을 참고해 새 HTML을 작성하지 않는다. iframe을 직접 만들거나 기존 `sandbox="allow-scripts allow-same-origin"`·`referrerpolicy="strict-origin-when-cross-origin"`를 제거하지 않는다.
- 내부 데이터·감사 파일은 `result.json`·`audit.json`을 유지하되, 사용자 전달 HTML을 `result.html`이나 `index.html`이라는 고정 이름으로 내지 않는다.

## 엣지 · 실패 처리
| 상황 | 처리 |
|---|---|
| parking 값 null | `자료없음`, 0으로 간주 금지 |
| `parking_ground`/`parking_underground` 중 **한쪽만** null | 판정 유보. `derived.parking_per_unit`은 과소값이므로 사용 금지 |
| total_households/units 없음 | 세대당 계산 금지 |
| 후보 매칭 실패 많음 | 매칭률과 미매칭 수 표시 |
| 반경 후보 과다 | limit/offset 또는 소반경 샘플로 데모, 전수 아님 표기 |

## 필수 단서
- 세대당 주차는 K-apt 등록값 기준.
- 기계식/상가/공유 주차 여부는 별도 확인 전까지 반영하지 않는다.
- 데모 표본은 전수 랭킹이 아니다.
- 출처 표기에는 공식 명칭 `공동주택관리정보시스템(K-apt)`과 링크 `https://www.k-apt.go.kr/web/main/index.do`를 함께 표시한다.

## 섹션마다 출처를 작게 단다

데이터 블록 하단에 `.src` 한 줄. **도구·API 이름은 쓰지 않는다.** 사용자가 아는 기관명만.

| 블록 | 출처 표기 |
|---|---|
| 단지 개요·세대수·준공·주차·연차 | `공동주택관리정보시스템(K-apt)` |
| 매매·전세·평당가·거래량 | `국토교통부 실거래가` |
| 학교·교통·생활·상권 등 장소 | `카카오맵` |
| 분양공고·분양가·주택형·입주월 | `청약홈` |
| 지도 (장소 마커) | `네이버 지도 · 카카오맵` |
| 지도 (분양공고 마커) | `네이버 지도 · 청약홈` |

- 🚨 **출처 문자열은 `ipzi-data` JSON으로 받지 않고 템플릿 마크업에 직접 박는다.**
  어느 블록이 어디서 왔는지는 실행마다 달라지지 않는다. 데이터로 받으면 채우는 걸 잊거나 틀리게 쓸 여지만 생긴다.
- 🚨 **한 블록에 두 출처가 섞이면 병기한다.** 예: `세대수·주차 — 공동주택관리정보시스템(K-apt) · 위치 — 카카오맵`.
  하나로 뭉뚱그리면 어느 숫자가 어디서 왔는지 사용자가 알 수 없다.
- 🚨 **쓰지 않은 기관을 출처로 적지 않는다.** 우리가 부르는 곳은 위 다섯 곳뿐이다.
- 히어로·유의사항·푸터에는 달지 않는다. **데이터 블록에만.**

## 디자인 정본
스킬 폴더 밖 문서에 의존하지 않도록 규칙을 여기 인라인으로 둔다.

- **CDN·외부 폰트·이모지 금지.** 아이콘은 `<symbol>` 인라인 + `<use>` 참조로 self-contained.
- 라이트/다크 양쪽. `prefers-color-scheme` + `:root[data-theme]` 모두 대응.
- 토큰만 사용: `--g/--y/--o/--r/--x/--brand/--up/--down/--zebra` (+ `-s` 배경 변형).
- 예외 상태: `null`은 "정보없음"(0 아님) · 표본 부족은 판정 유보 · 45건 캡 도달은 "목록 불완전" 표기.
- `★`·`☆`는 활자 기호이며 이모지가 아니다. 등급 표기에 사용 가능.
- 지도 카드 CSS: `.map{overflow-x:auto; overflow-y:hidden}` + `.map iframe{display:block; min-width:720px}`.
  `overflow:hidden`만 주면 iframe이 카드 폭에 짓눌려 지도가 최소 줌(한반도)으로 떨어진다.
- 🚨 **지도 링크는 발급 후 7일 만료.** 산출물 지도 캡션에 유효기간·재발급 필요를 반드시 적는다.
  만료 시 iframe이 빈 화면이 되는데, 원인 표기가 없으면 리포트가 고장난 것처럼 보인다.
- 🚨 **반경 눈금 마커를 넣지 않는다.** 예전엔 `fitBounds`가 반경 원을 무시해 원이 잘리는 걸 막으려고
  정북·남·동·서에 회색 더미 마커 4개를 심었다. 사용자에게는 **정체를 알 수 없는 점**으로 보여 혼란만 준다.
  **원이 잘리더라도 마커는 실제 장소만 찍는다.** (근본 해결은 `render.ts`가 원을 bounds에 포함하도록 고치는 것 — 발견사항 6번)

## 표본 규칙
- 반경 후보가 많으면 전수가 아니라 표본이다. 표본 수와 원천 후보 수를 함께 표기한다.
- 카카오 검색은 쿼리당 45건 캡이 있다. 캡에 도달하면 "목록 불완전"으로 표기한다.

## 🚨 `enrich_complex_info` 는 이름이 같은 단지도 떨어뜨린다 (실측 2026-07-10)

**"K-apt 미매칭 = 그 단지가 없다"가 아니다.** 좌표가 어긋나면 이름이 글자까지 같아도 제외된다.

`위례2차아이파크아파트` 실측 — K-apt 에 분명히 있다(`A10027553` · 495세대 · 세대당 주차 1.76):
```
카카오 좌표  37.479738, 127.143743
K-apt 좌표   └─ 261m 떨어져 있음     ← 기본 radius_m=250 을 11m 넘긴다
```

| `radius_m` | 이름 완전일치 후보 | 이름 무관 후보(힐스테이트) | 결과 |
|---|---|---|---|
| 250 (기본) | 후보에 없음 | 104m | `NEARBY_BUT_NAME_MISMATCH` |
| 400 | 0.543 | **0.558** ← 더 높다 | `NEARBY_BUT_NAME_MISMATCH` |
| 500 | 0.635 (임계 0.65에 0.015 부족) | 0.594 | `LOW_CONFIDENCE_MATCH` |

점수가 `radius_m` 에 따라 움직이고, **이름 완전일치가 거리에 밀린다.** 반경을 늘려도 해결되지 않는다.

- 🚨 **`not_found` 를 "K-apt 미매칭"으로 뭉뚱그려 적지 않는다.** 도구가 주는 `reason` 을 그대로 구분해 쓴다.
  `NO_COMPLEX_WITHIN_RADIUS`(반경 안에 후보 없음) · `NEARBY_BUT_NAME_MISMATCH`(후보는 있으나 이름 불일치)
  · `LOW_CONFIDENCE_MATCH`(임계 미달). 사유가 다르면 사용자가 할 일도 다르다.
- 🚨 **`candidates[]` 에 입력과 이름이 사실상 같은 후보가 있으면 화면에 보인다.**
  조용히 버리면 "반경 내 전수"라고 읽힌다. 표본 수를 인용할 때 **누락 가능성을 함께 적는다.**
- 🚨 **반대 방향 오류도 있다.** 거리가 0이면 이름이 아무리 달라도 `matched`(score 0.75)가 난다.
  → 후보 좌표는 반드시 **그 단지의 카카오 좌표**를 넣는다. 기준 단지 좌표를 돌려쓰면 엉뚱한 단지로 바뀐다.

### 복구 절차 (코드 수정 없이 지금 가능)

`not_found` 여도 `candidates[]` 는 **`kapt_code` 를 함께 준다.** 반경만 넓히면 이름 완전일치 후보가 그 안에 나타난다.

```
1. enrich_complex_info(complexes, radius_m=500)      ← 기본 250 으로는 후보에조차 안 뜬다
2. status != "matched" 인 항목의 candidates[] 를 훑는다
3. 정규화한 이름이 입력과 같으면(공백·'아파트' 꼬리 제거 후 일치) 그 kapt_code 를 채택
4. get_complex_info(kapt_code, detail=true) 로 값을 직접 가져와 랭킹에 넣는다
5. 화면에 "좌표 불일치로 자동 매칭 실패 → 이름 일치로 복구" 를 명시한다
```

실측: `위례2차아이파크아파트` 는 `radius_m=500` 에서 `candidates[0]` 으로 나오고(`A10027553`, 261m, score 0.635),
`get_complex_info` 는 `parking_per_unit 1.76` 을 정상 반환한다.

- 🚨 **이름이 "사실상 같다"의 기준을 느슨하게 잡지 말 것.** 공백·`아파트` 꼬리 제거 후 **완전일치**만 복구한다.
  `위례아이파크` 와 `위례2차아이파크` 는 다른 단지다. 애매하면 복구하지 말고 제외 사유를 적는다.
- 근본 해결은 MCP 몫이다(점수에서 반경 정규화 제거 · 이름 완전일치 가산 · 사유 코드 정정) — 발견사항 30번.
  고쳐지면 이 복구 절차는 불필요해진다. 그때까지는 **스킬이 직접 메운다.**

## 변경 이력
| version | 날짜 | 변경 |
|---|---|---|
| 1.0.0 | 2026-07-09 | 패키지 배포본. `derived.parking_per_unit` 부분 결측 0 흡수 우회(원값 직접 검사·판정 유보), 결측 단지 랭킹 제외+사유 카드, 디자인 규칙 인라인, 지도 TTL·눈금마커·`.map` overflow 규칙 반영 |
| 1.0.1 | 2026-07-10 | **`enrich_complex_info` 매칭 실패 사유를 구분 표기**하는 규칙 추가. 이름이 완전히 같은 단지도 좌표 261m 차이로 제외된다(위례2차아이파크 실측). `not_found` 를 'K-apt 미매칭'으로 뭉뚱그리지 않는다 · 반경 눈금 마커 제거 |
| 1.0.2 | 2026-07-10 | 요약 카드에 **상위 3개 단지** 블록 추가(`rows` 에서 직접 파생 — 별도 필드 없음). 왼쪽 랭킹 대비 빈 공간 해소 |
| 1.0.3 | 2026-07-10 | **표본 범위·제외 단지를 독립 카드로 분리.** 푸터 유의사항·출처와 `<br>` 로 붙어 있어 제외 사유가 묻혔다 · 섹션별 출처 표기 · `javascript:` 스킴 가드 |
| 1.0.4 | 2026-07-15 | 공용 고정 템플릿 렌더러 사용을 의무화하고 `<기준대상>_주차랭킹.html` 동적 파일명·iframe 보안 속성 보존·새 HTML 작성 금지를 명시 |


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
