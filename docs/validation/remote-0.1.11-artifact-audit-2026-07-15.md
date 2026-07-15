# Remote 0.1.11 Claude Desktop 산출물 감사

- 날짜: 2026-07-15
- Decision: 류호윤 + Codex
- 대상: `plugintest/claudeDesktopTest/v0.1.11`
- 방법: 기존 산출물만 읽어 HTML embedded JSON·`result.json`·`audit.json`·XLSX·파일명·금지 패턴을 대조했다. MCP 재호출과 산출물 수정은 하지 않았다.

## 종합 판정

다섯 메인 Skill은 모두 사용자 HTML과 `result.json`의 데이터가 정확히 일치했고, 동적 HTML 파일명과 Remote provenance가 확인됐다. 사용자 HTML에는 `DB크로스체크`·`근거대조`·`mcp__`·개인 절대경로·비밀 이름이 없었고 대상 폴더의 심볼릭 링크도 0건이다.

0.1.11 실행 자체는 완료됐지만, 아래 NEEDS FIX 다섯 건 때문에 최종 strict PASS로 확대하지 않는다. 이 다섯 건은 `ipzitalk-skill` `198223a`와 Remote `0.1.12`에 수정됐으며 새 Desktop 세션 재검증이 남았다.

| Skill | 확인된 PASS | 0.1.11 NEEDS FIX | 후속 상태 |
|---|---|---|---|
| Complex Overview All | HTML/JSON 일치, `<단지명>_한눈에보기.html`, 확정월 12개·중복 0, MCP 23회, Remote provenance | `60~85㎡` 면적 구간을 `84㎡ 839세대`로 단정, `auditIncomplete` 명시 필드 없음 | 0.1.12 계약 수정, 재실행 필요 |
| Location Report | HTML/JSON 일치, `<대상>_입지보고서.html`, `auditIncomplete:false`, Remote provenance, 사용자 세션에서 렌더·콘솔 오류 없음 보고 | center 관련 4콜과 총 21콜 중 불필요한 `get_address` 재검색, 정본 파일이 루트와 `out/`에 분산 | 0.1.12 계약 수정, 재실행 필요 |
| Presale Report | HTML/JSON 일치, `<단지명>_인근_분양리포트.html`, MCP 3회, `auditIncomplete:false`, 집계·Remote provenance | 과거 입주를 설명하면서 부정문에 `앞으로 입주할 신규 물량` 사용 | 0.1.12 계약 수정, 재실행 필요 |
| Read Notice Report | HTML/JSON 일치, `<공고명>_공고리포트.html`, Remote MCP 1회, `auditIncomplete:false`, XLSX 9시트 유효 | 기준 주택형을 MCP·추출 뒤 질문, 공고 원문과 반대로 발코니 확장비를 공급금액 포함으로 기록 | 0.1.12 계약 수정, 재실행 필요 |
| Read Notice Compare | HTML/JSON 일치, `<A>_<B>_공고비교.html`, Remote MCP 2회, `auditIncomplete:false`, XLSX 10시트 유효 | 초기 현금 0.27억 대 0.26억인데 `initialCashWinner:null`, `실거래·시세 흐름` 혼용 | 0.1.12 계약 수정, 재실행 필요 |

## 공통 검사 결과

- HTML embedded JSON과 `result.json`: 5/5 일치
- HTML 동적 파일명: 5/5 확인
- 사용자 HTML 금지 문구·개인 절대경로·비밀 이름: 0건
- 전체 대상 폴더 비밀 이름: 0건
- 대상 폴더 심볼릭 링크: 0건
- 과정 문서·audit·backdata의 개인 절대경로와 MCP 식별자는 내부 감사 정보이므로 사용자 HTML 검사와 분리했다.
- Read Notice Report XLSX: 9시트, ZIP·필수 시트 검증 통과
- Read Notice Compare XLSX: 10시트, ZIP·필수 시트 검증 통과

## Recent Market Trend

별도 `0.1.10` 산출물은 목적 입력·표 정렬·`auditIncomplete:false`를 통과했지만 사용자 HTML 이름이 `result.html`이다. 동적 파일명은 0.1.11 이후 계약이므로 `<지역>_시장동향_<기준월>.html`을 0.1.12 새 세션에서 한 번 확인해야 한다.

## 지도·CSP 경계

Location Report 실행 대화에는 로컬 HTTP 렌더가 정상이고 콘솔 오류가 없었다는 기록이 있다. 그러나 보존된 콘솔 로그나 스크린샷으로 iframe `sandbox`·`referrerpolicy`·실제 Naver 지도 CSP 조합을 독립 재현한 것은 아니므로 잔여 보안 gate는 완료 처리하지 않는다.

## 다음 단계

0.1.12에서는 전체 기능을 처음부터 재감사하지 않고 위 NEEDS FIX 다섯 지점과 Recent Market Trend 동적 파일명만 집중 확인한다. 모두 통과하면 기능 회귀를 닫고 실제 지도/CSP 및 문서 추출 보안 검증으로 이동한다.
