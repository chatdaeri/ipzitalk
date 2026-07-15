# Remote 0.1.12 실증 피드백 보강 검증

- 날짜: 2026-07-15
- Decision: 류호윤 + Codex
- 작업 브랜치: `feat/remote-0.1.8-security-sync`
- SSOT: `ipzitalk-skill` `198223a945a2c4627348ea1df0a0d2e931cc3038`

## 변경 범위

Remote `0.1.11`의 Claude Desktop 실산출물 5종을 대조해 사실성·실행 계약을 보강하고 `0.1.12`로 동기화했다.

| Skill | 버전 | 보강 내용 |
|---|---:|---|
| `ipzitalk-complex-overview-all` | `1.1.5` | K-apt 면적 구간을 정확한 단일 주택형 재고로 추론하지 않음 |
| `ipzitalk-location-report` | `1.3.5` | 단지 공식주소 2콜 center 체인 허용, 불필요한 주소 재검색 금지, 동적 호출 예산 |
| `ipzitalk-presale-report` | `1.1.4` | 부정문에서도 과거 입주를 미래 입주 표현으로 쓰지 않음 |
| `ipzitalk-read-notice-compare` | `1.2.5` | 공고 시점 이격과 무관하게 초기 현금이 낮은 쪽을 표시 |
| `ipzitalk-read-notice-report` | `1.2.5` | 목적·기준 주택형 선확보, 발코니·옵션 포함 여부의 구체 원문 조항 우선 |
| `ipzitalk-recent-market-trend` | `1.2.6` | 변경 없음 |

Location Report의 호출 계약은 숫자 하나를 강제하지 않는다. 검색·지도 고정분 16회에 실제 center 해소 호출 수와 허용된 0건 fallback 수를 더해 기대 호출 수를 계산한다. 단지명은 `get_complex_info` 1회 후 좌표가 없을 때 공식 주소 `get_geocode` 1회만 허용하며, 해소 성공 뒤 `get_address` 재검색은 금지한다.

## 체크포인트

- `ipzitalk-skill` `0aef9cd` — Desktop 실증 5건 회귀 RED
- `ipzitalk-skill` `198223a` — 근거·preflight·winner 계약 GREEN
- `ipzitalk` `400ed1b` — Remote `0.1.12` 버전·Skill 계약 RED
- `ipzitalk` `e15450f` — Remote `0.1.12` 패키지 GREEN

## 검증 결과

- `node --test tests/*.test.mjs`: 56/56 통과
- `node scripts/validate_namespace_compat.mjs`: MCP 의존 Skill 24개 통과
- `node scripts/validate-package.mjs`: 통과
- `claude plugin validate --strict .`: 통과
- `claude plugin validate --strict plugins/ipzitalk-remote`: 통과
- SSOT Skill 6개와 패키지 사본: 차이 0건
- 공통 artifact 3개: 차이 0건
- `git diff --check`: 통과
- 공식 Python Skill·plugin validator: PyYAML 미설치로 시작하지 못함. 새 의존성은 설치하지 않음

## Claude 사용자 프로필

`claude plugin update ipzitalk-remote@ipzitalk --scope user`로 Remote를 `0.1.11`에서 `0.1.12`로 갱신했다.

- launcher: `ipzitalk@ipzitalk` `0.1.1`, enabled
- Remote: `ipzitalk-remote@ipzitalk` `0.1.12`, enabled
- Local: 미설치
- 설치 cache: `~/.claude/plugins/cache/ipzitalk/ipzitalk-remote/0.1.12`
- 저장소 Remote와 설치 cache: 차이 0건

## 남은 Desktop E2E

0.1.11 기존 산출물의 정적 감사는 [별도 감사 기록](remote-0.1.11-artifact-audit-2026-07-15.md)으로 완료했다. HTML/JSON 5/5 일치, 동적 파일명 5/5, 사용자 HTML 금지 패턴 0건, XLSX 9·10시트 유효성을 확인했다. 아래 항목은 0.1.11에서 발견해 0.1.12에서 수정한 지점과 Complex의 명시적 `auditIncomplete:false`를 다시 확인하는 집중 회귀다.

새 Claude Desktop 로컬 Code 탭 세션에서 다음을 확인한다.

1. Complex Overview: `60~85㎡ 구간`과 실제 `84㎡ 거래 표본`이 분리되는지 확인
2. Location Report: 단지 입력에서 `get_complex_info → 공식주소 get_geocode`만 사용하고 산출물이 Skill 출력 폴더에 모이는지 확인
3. Presale Report: `조회일 이후 입주월이 확인된 공고는 없음`처럼 중립적으로 표현하는지 확인
4. Notice Report: 목적과 기준 주택형을 데이터 호출 전에 확보하고 발코니 확장비 별도 부담을 정확히 표시하는지 확인
5. Notice Compare: 초기 현금이 다른 경우 낮은 쪽 winner가 표시되는지 확인

실제 Naver 지도와 CSP 조합, 공개 release SHA 재잠금은 별도 보안·릴리스 gate로 남긴다. 원격 push·PR은 사용자 지시에 따라 오늘 작업 종료까지 보류한다.
