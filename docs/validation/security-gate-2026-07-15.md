# 잔여 보안 검증 기록

- 날짜: 2026-07-15
- Decision: 류호윤 + Codex
- 대상: Remote `0.1.12` 패키지와 `ipzitalk-skill` 문서·HTML 보안 계약
- 범위: 실제 지도 응답, iframe 경계, 악성 PDF, legacy HWP, HWPX 제한 추출

## 종합 판정

문서 입력과 HTML 정적 보안 계약은 통과했다. 실제 지도 URL도 HTTP 200으로 Naver 지도 SDK, 실제 장소 마커 7개, 1,500m 반경 원 데이터를 반환했다. 다만 지도 페이지 응답에는 CSP(Content Security Policy, 콘텐츠 보안 정책) 헤더가 없고, Codex 인앱 브라우저 연결이 캐시 버전 불일치로 시작되지 않아 지도 픽셀과 브라우저 콘솔을 독립 재검증하지 못했다. 따라서 Phase 1A 전체 보안 gate는 아직 완료가 아니다.

| 항목 | 판정 | 근거 |
|---|---|---|
| HTML 악성 데이터 경계 | PASS | 비실행 JSON 경계·이스케이프·URL 제한·iframe 속성 회귀 통과 |
| 지도 iframe 정적 계약 | PASS | `sandbox="allow-scripts allow-same-origin"`, `referrerpolicy="strict-origin-when-cross-origin"`, 공식 `/map?d=<id>`만 허용 |
| 실제 지도 응답 | PARTIAL PASS | HTTP 200, Naver SDK, 마커 7개, 반경 1,500m 확인 |
| 지도 페이지 CSP | LOCAL GREEN | `remote-mcp` 전용 브랜치에서 nonce 기반 Report-Only 구현·402개 테스트 통과, 배포 전 |
| 지도 픽셀·콘솔 | BLOCKED | 인앱 브라우저 미노출 및 브라우저 Skill 진단 문서 캐시 버전 불일치 |
| 정상 PDF 제한 추출 | PASS | 구리역 하이니티 리버파크 PDF 3,488줄·500,533바이트 추출 |
| 손상·명령 삽입 PDF | PASS | 손상된 xref PDF를 exit 2로 거부하고 출력 파일을 남기지 않음 |
| legacy HWP | SAFE FAIL | 실제 HWP 입력을 임의 우회하지 않고 `hwp5txt` 미설치로 exit 2, 출력 파일 없음 |
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
- 결과: `hwp5txt is required for legacy HWP extraction`, exit 2, 최종 출력 파일 0개
- 현재 환경에는 `hwp5txt`가 없어 정상 legacy HWP 추출 성공까지 증명하지 못했다. 새 의존성은 설치하지 않았다.
- 실패 시 다른 변환기나 무제한 셸 처리로 우회하지 않으므로 안전 실패 계약은 확인했다.

### 실제 지도 응답

- Location Report 산출물의 발급 지도 URL을 직접 조회했다.
- 응답: HTTP 200, `content-type: text/html`, `x-content-type-options: nosniff`
- 본문: `oapi.map.naver.com` SDK, 실제 장소 마커 7개, 중심 좌표, `radius_m:1500`, `naver.maps.Circle` 확인
- 누락: `Content-Security-Policy` 응답 헤더와 동등한 meta 정책

## 브라우저 검증 차단 사유

Codex 인앱 브라우저에는 연결 가능한 브라우저가 없었다. Browser Skill의 필수 진단도 설치된 Skill 버전과 런타임이 참조하는 캐시 버전이 달라 문서를 찾지 못했다. Skill 지침에 따라 독립 Chrome·Playwright 같은 다른 브라우저 표면으로 우회하지 않았다.

이전 Claude Desktop 실행 대화에는 지도 렌더와 콘솔 오류 없음 보고가 있지만 보존된 콘솔 로그나 스크린샷이 없으므로 이번 독립 보안 검증의 PASS 근거로 확대하지 않는다.

## 후속 조치

1. `remote-mcp/security/map-csp-2026-07-15`의 nonce 기반 `Content-Security-Policy-Report-Only`를 리뷰·배포한다. RED `4a9ca71`, GREEN `3a48b5c`이며 typecheck·402개 테스트·build가 통과했다.
2. 배포 뒤 인앱 브라우저에서 지도 픽셀·마커·반경 원과 CSP 콘솔 위반을 재검증하고 위반 0건일 때만 강제 `Content-Security-Policy`로 전환한다.
3. legacy HWP 공개 지원을 유지하려면 승인된 환경에 `hwp5txt`를 준비해 정상 문서와 손상 문서의 성공·거부 경계를 재검증한다.
4. 위 1~3은 현재 PR 전 작업에서 미완료 gate로 유지하며, 검증 결과를 과장해 PASS 처리하지 않는다.

## CSP 로컬 보강

기존 2026-07-13 결정에 따라 강제 정책보다 Report-Only를 먼저 적용했다. `/map` 요청마다 `crypto.randomUUID()`로 nonce를 만들고 데이터·Naver SDK·렌더 스크립트 세 곳에 같은 nonce를 부여한다. 정책은 `strict-dynamic`과 Naver SDK fallback origin을 사용하고 `object-src`, `base-uri`, `form-action`을 차단한다. Referrer·Permissions·nosniff 헤더도 함께 적용했다.

이 변경은 아직 push·PR·배포하지 않았으므로 현재 운영 지도 응답에는 반영되지 않았다.
