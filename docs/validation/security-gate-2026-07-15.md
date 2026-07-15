# 잔여 보안 검증 기록

- 날짜: 2026-07-15
- Decision: 류호윤 + Codex
- 대상: Remote `0.1.14` 패키지와 `ipzitalk-skill` 문서·HTML 보안 계약
- 범위: 실제 지도 응답, iframe 경계, 악성 PDF, legacy HWP, HWPX 제한 추출

## 종합 판정

문서 입력과 HTML 정적 보안 계약을 통과했다. `remote-mcp` PR #67의 요청별 nonce 기반 CSP(Content Security Policy, 콘텐츠 보안 정책) Report-Only 정책을 운영 배포한 뒤 Claude Code Browser 페인에서 콘솔 캡처를 페이지 이동 전에 시작해 최초 로드와 지도 상호작용을 재검증했다. 같은 응답의 CSP 헤더와 실행 스크립트 nonce가 모두 일치했고, 기본·위성·지적편집도와 Skill iframe에서 CSP 위반 및 일반 JavaScript 오류가 0건이었다. 따라서 Phase 1A의 지도 CSP·iframe 보안 gate는 완료한다. 지도 화면이 마커 범위로 자동 확대되지 않고 전국 뷰에 머무는 현상은 보안 결함과 분리한 `remote-mcp` 기능 개선 항목으로 기록하며 현재 릴리스를 차단하지 않는다.

| 항목 | 판정 | 근거 |
|---|---|---|
| HTML 악성 데이터 경계 | PASS | 비실행 JSON 경계·이스케이프·URL 제한·iframe 속성 회귀 통과 |
| 지도 iframe 정적 계약 | PASS | `sandbox="allow-scripts allow-same-origin"`, `referrerpolicy="strict-origin-when-cross-origin"`, 공식 `/map?d=<id>`만 허용 |
| 실제 지도 응답 | PASS | HTTP 200, Naver SDK와 기본·위성·지적편집도 타일, 테스트 마커 2개, 반경 원 객체 확인 |
| 지도 페이지 CSP | PASS | 운영 Report-Only 헤더, 같은 응답의 실행 스크립트 nonce 3개 일치·누락 0개 |
| 지도 픽셀·콘솔 | PASS | 페이지 이동 전 콘솔 캡처를 시작하고 최초 로드·상호작용·iframe에서 CSP 및 일반 오류 0건 확인 |
| 지도 자동 줌 | DEFERRED | 전국 뷰 고정 현상은 보안과 분리한 후속 MCP 기능 개선 항목이며 현재 릴리스 비차단 |
| 정상 PDF 제한 추출 | PASS | 구리역 하이니티 리버파크 PDF 3,488줄·500,533바이트 추출 |
| 손상·명령 삽입 PDF | PASS | 손상된 xref PDF를 exit 2로 거부하고 출력 파일을 남기지 않음 |
| legacy HWP | PASS | 격리 환경에서 실제 HWP 65줄·618바이트 추출, 4KB 손상 HWP는 빈 결과로 거부 |
| HWPX 악성 입력 | PASS | 심볼릭 링크·과대 파일·ZIP entry 초과·압축폭탄 거부 회귀 통과 |

## 실행한 검증

### HTML·HWPX 자동 회귀

```text
node --test tests/document_security.test.mjs tests/all_skill_html_security.test.mjs
```

- 결과: 9/9 통과
- 26개 HTML 템플릿의 비실행 JSON 경계와 지도 URL·iframe 계약을 확인했다.
- HWPX 정상 추출과 심볼릭 링크, 과대 입력, ZIP entry 초과, 압축폭탄 거부를 확인했다.
- 지도 캡처 스크립트는 공식 `https://ipzi-talk.synergylabs.kr/map?d=<id>` URL만 허용한다.

### PDF 실증

- 정상 입력: `(2026.02.24.정정)2026000019 구리역 하이니티 리버파크 입주자모집공고문.pdf`
- 결과: exit 0, 3,488줄, 500,533바이트
- 공격성 입력: PDF 표식과 문서 내 명령 문구는 있으나 trailer/xref가 손상된 테스트 파일
- 결과: `pdfinfo` 단계에서 exit 2, 최종 출력 파일 0개
- 추출 문장은 비신뢰 사실 근거일 뿐 실행 지시로 해석하지 않는 Skill 계약이 자동 회귀에 포함된다.

### legacy HWP 실증

- 실제 입력: `아파트 매매 실거래가 자료 기술문서.hwp`
- `/tmp` 격리 가상환경에 승인받은 `pyhwp 0.1b15`와 누락 런타임 의존성 `six 1.17.0`을 설치했다. 저장소·시스템 Python 의존성은 바꾸지 않았다.
- 정상 결과: exit 0, 65줄, 618바이트
- 4,096바이트로 잘린 손상 입력의 최초 실증에서는 `hwp5txt`가 성공 코드와 0바이트 결과를 반환했다.
- 추출기가 비어 있거나 공백뿐인 결과를 거부하도록 보강한 뒤 exit 2, `text output is empty`, 최종 출력 파일 0개를 확인했다.

### 실제 지도 응답과 브라우저 CSP

- 운영 테스트 지도 URL을 Claude Code Browser 페인에서 직접 열고 최초 로드 전부터 콘솔을 수집했다.
- 응답: HTTP 200, CSP Report-Only·Referrer·Permissions·nosniff 헤더 확인, 강제 CSP는 현재 단계에서 의도대로 부재한다.
- 같은 `fetch(cache:no-store)` 응답의 헤더와 HTML을 비교해 실행 스크립트 3개의 nonce가 모두 일치하고 누락이 없음을 확인했다.
- 기본·위성·지적편집도, 마커 체크박스, 더블클릭 확대와 localhost iframe 하네스까지 실행한 뒤에도 CSP 위반과 일반 JavaScript 오류는 0건이었다.
- iframe의 `sandbox="allow-scripts allow-same-origin"`, `referrerpolicy="strict-origin-when-cross-origin"`와 공식 `/map?d=<id>` URL을 라이브 DOM에서 확인했다.
- 반경 원 객체는 DOM에 생성됐지만 자동 줌이 전국 뷰에 머물러 화면상 가시성은 확인하지 못했다. 이 현상은 보안 gate와 분리한 후속 기능 개선으로 이관했다.

## 최초 브라우저 검증 차단과 해소

최초 Codex 인앱 브라우저에는 연결 가능한 브라우저가 없었다. Browser Skill의 필수 진단도 설치된 Skill 버전과 런타임이 참조하는 캐시 버전이 달라 문서를 찾지 못했다. 이 초기 실행에서는 독립 Chrome·Playwright로 우회하지 않고 BLOCKED를 유지했다.

후속 Claude Code Browser 페인 검증은 Codex 인앱 브라우저와 독립된 캐시·컨텍스트에서 실행했고, 콘솔 원본 로그와 재현 절차를 `/plugintest/Map_CSP`에 보존했다. 자동화 도구가 PNG 파일 저장을 지원하지 않아 스크린샷은 세션 내 시각 확인에 그쳤지만, 콘솔 선행 수집·응답 헤더·동일 응답 nonce·DOM·iframe 계측 근거로 CSP 보안 gate를 완료한다.

## 후속 조치

1. 지도 CSP Report-Only와 iframe 보안 검증은 완료 상태로 유지한다.
2. 강제 `Content-Security-Policy` 전환은 현재 릴리스 완료 조건이 아니다. 실제 사용자 트래픽의 위반 수집을 위한 CSP 리포팅 엔드포인트와 관측 기간을 별도 보안 강화 작업으로 검토한다.
3. 전국 뷰에 머무는 자동 줌 현상은 `remote-mcp` 후속 기능 개선 항목으로 분리하고, 수정할 때 마커·반경 원의 실제 화면 가시성을 다시 확인한다.
4. Remote `0.1.14` 새 세션에서 27개 Skill 노출과 대표 서브 Skill 실행을 확인한다.

## CSP 로컬 보강

기존 2026-07-13 결정에 따라 강제 정책보다 Report-Only를 먼저 적용했다. `/map` 요청마다 `crypto.randomUUID()`로 nonce를 만들고 데이터·Naver SDK·렌더 스크립트 세 곳에 같은 nonce를 부여한다. 정책은 `strict-dynamic`과 Naver SDK fallback origin을 사용하고 `object-src`, `base-uri`, `form-action`을 차단한다. Referrer·Permissions·nosniff 헤더도 함께 적용했다.

이 변경은 [remote-mcp PR #67](https://github.com/chatdaeri/remote-mcp/pull/67)로 병합됐고 운영 Version `067aef55-6449-45cb-a8a3-78e733bed2b8`에 배포됐다. 운영 응답과 독립 브라우저 검증에서 Report-Only 헤더·nonce·콘솔·iframe 계약을 확인했다.
