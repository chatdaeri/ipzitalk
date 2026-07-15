# REF_DB → 사용자 표시 출처 매핑

`ipzitalk-find-region`, `ipzitalk-find-fit`, `ipzitalk-find-nearby`, `ipzitalk-find-commute`는 ipzitalk mcp의 `search_announcement_info`가 반환하는 값을 그대로 화면에 옮긴다. REF_DB는 API 응답을 그대로 저장한 것이므로 정확한 원본(ground truth)이다 — ipzitalk-read-notice-report(brief/limits/funding 섹션)처럼 PDF 원문과 DB 값을 대조할 필요는 없고, **화면에 찍힌 값이 DB가 준 값과 정확히 같은가**만 확인하면 된다 (아래 "크로스체크" 참고).

**테이블명(REF_DB, presales, presale_units 등)은 내부 구현 용어다. 사용자 HTML에는 절대 노출하지 않는다** — HTML에는 이 문서 오른쪽 칸의 사용자 표시 문구만 쓴다. XLSX 등 내부 백데이터에는 테이블명을 그대로 적어도 된다.

| REF_DB 테이블 | 담기는 필드 → 이 스킬들의 `ipzi-data` JSON 매핑 | 사용자 표시 출처 |
|---|---|---|
| `presales` | 공고명, 공고일, 주소, 최고 분양가, 공급세대수, 원문 URL → `listings[]`의 최상위 필드(units 제외) | 청약홈 분양정보 |
| `presale_units` | 주택형, 주택형별 최고가, 주택형별 공급세대수 → `listings[].units[]` | 청약홈 주택형별 분양정보 |
| geocode API(`get_geocode`/`get_address`) 보완좌표 | REF_DB에 좌표가 없어 새로 채운 레코드의 좌표 | 주소 보완좌표 |

## HTML에 넣는 방법

`ipzi-data.sourceNote`에 실제로 쓴 출처만 조합해 한 줄로 넣는다.

```txt
데이터 출처: 청약홈 분양정보 · 청약홈 주택형별 분양정보
```

주소 보완좌표를 하나라도 썼다면 이어붙인다:

```txt
데이터 출처: 청약홈 분양정보 · 청약홈 주택형별 분양정보 · 주소 보완좌표(일부)
```

## 크로스체크 방법

REF_DB가 이미 정확하므로 검증 대상은 "렌더링이 원본을 그대로 옮겼는가"다. `ipzi-data` JSON을 채운 뒤:

1. `listings[]`의 최상위 필드(`name`, `dateStr`, `addressDetail`, `maxPriceLabel`, `supplyCount`, `detailUrl`)를 `search_announcement_info`가 반환한 같은 `announcement_id` 레코드와 하나씩 대조한다. 표시 형식 변환(예: `1079000000` → `"10.79억"`)은 허용되지만 숫자·문자 자체가 달라지면 안 된다.
2. `listings[].units[]`의 `type`/`maxPrice`/`supply`를 원본 레코드의 unit 배열과 대조한다.
3. 하나라도 어긋나면 렌더링 버그이며, `위치 확인 필요`나 `공고문 원문 확인 필요` 같은 "정보 부족" 케이스와 구분해서 반드시 고친다.

## 백데이터(XLSX)를 만드는 경우

find-* 시리즈는 라이브 DB 값을 그대로 쓰므로 기본적으로 XLSX가 필요 없다. 사용자가 검증용 백데이터를 요청하면 각 행에 `출처` 컬럼을 추가하고 내부 테이블명(`presales`/`presale_units`)을 그대로 적는다 — XLSX는 감사용이라 HTML의 구현 용어 금지 규칙이 적용되지 않는다.
