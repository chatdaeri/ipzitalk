# Remote 0.1.11 리포트 계약 보강 검증

- 날짜: 2026-07-15
- Decision: 류호윤 + Codex
- 작업 브랜치: `feat/remote-0.1.8-security-sync`
- SSOT: `ipzitalk-skill` `2e603145e2bba97b47d088a2923cf8fd602093f0`

## 변경 범위

Remote 플러그인을 `0.1.10`에서 `0.1.11`로 올리고 메인 Skill 6개를 최신 SSOT로 동기화했다.

| Skill | 버전 |
|---|---|
| `ipzitalk-complex-overview-all` | `1.1.4` |
| `ipzitalk-location-report` | `1.3.4` |
| `ipzitalk-presale-report` | `1.1.3` |
| `ipzitalk-read-notice-compare` | `1.2.4` |
| `ipzitalk-read-notice-report` | `1.2.4` |
| `ipzitalk-recent-market-trend` | `1.2.6` |

주요 변경은 다음과 같다.

- 사용자 전달용 HTML 파일을 단지·지역·공고·기준월 기반 이름으로 생성한다.
- Location Report의 교통·생활·교육·광역 표에서 `직선거리` 같은 숫자 헤더와 숫자 값을 같은 오른쪽 정렬로 표시한다.
- Presale Report는 조회일과 입주월을 연월 단위로 비교해 과거 입주를 미래 물량으로 표현하지 않는다.
- 최근 6개월 신규 공고 0건만으로 시장 성숙·공급 소진을 추론하지 않는다.
- 후속 분석 표현을 `최근 실거래가 추이`로 명확히 한다.

기계 처리와 기존 자동화 호환성을 위해 `result.json`·`audit.json`·XLSX는 고정 이름을 유지한다. Location Report의 HTML/PPTX/DOCX는 같은 동적 basename을 사용하고, 후속 형식을 추가하면 감사 파일의 생성 파일 목록도 갱신한다.

## 파일명 안전 계약

공용 renderer는 선택적인 `--file-name`을 받고 다음을 보장한다.

- Unicode NFC 정규화
- 제어문자와 보이지 않는 bidi·zero-width 문자 제거
- 경로·예약문자 치환과 Windows 예약 이름 fallback
- 코드포인트 기준 80자 제한
- basename·dirname 재검사로 출력 디렉터리 이탈 차단
- 대상명이 없을 때 `<skillName>.html` fallback, `result.html` 미사용

## 체크포인트

- `ipzitalk-skill` `59150cc` — 출력 이름·표 정렬·시점/추론 회귀 RED
- `ipzitalk-skill` `2e60314` — 메인 6개와 공용 renderer GREEN
- `ipzitalk` `40ff452` — Remote `0.1.11` 동기화 계약 RED
- `ipzitalk` `205e2c7` — Remote `0.1.11` 패키지 GREEN

## 검증 결과

- `node --test tests/*.test.mjs`: 53/53 통과
- 신규 집중 회귀 테스트: 41/41 통과
- `node scripts/validate_namespace_compat.mjs`: MCP 의존 Skill 24개 통과
- `node scripts/validate-package.mjs`: 통과
- `claude plugin validate --strict .`: 통과
- `claude plugin validate --strict plugins/ipzitalk-remote`: 통과
- SSOT Skill 6개와 패키지 사본: 차이 0건
- 공통 artifact 3개: 차이 0건
- `git diff --check`: 통과
- 공식 Python quick validator: PyYAML 미설치로 시작하지 못함. 새 의존성은 설치하지 않음

플러그인 저장소에는 npm 기반 typecheck/test/build script가 없으므로 존재하지 않는 검증 명령은 실행하지 않았다.

## Claude 사용자 프로필 갱신

`claude plugin update ipzitalk-remote@ipzitalk --scope user`로 Remote를 `0.1.10`에서 `0.1.11`로 갱신했다.

- launcher: `ipzitalk@ipzitalk` `0.1.1`, enabled
- Remote: `ipzitalk-remote@ipzitalk` `0.1.11`, enabled
- Local: 미설치
- 설치 cache: `~/.claude/plugins/cache/ipzitalk/ipzitalk-remote/0.1.11`
- 저장소 Remote와 설치 cache: 차이 0건
- 무관 플러그인: 변경하지 않음

## 남은 Desktop E2E

Claude Desktop의 기존 열린 세션은 `0.1.11` 증빙으로 사용하지 않는다. 새 로컬 Code 탭 세션에서 다음을 확인한다.

1. `ipzitalk-location-report`: 교통·생활·교육·광역 표의 `직선거리` 헤더와 값 정렬, `<대상>_입지보고서.html` 파일명
2. `ipzitalk-presale-report`: 과거 입주 시점 표현, 최근 공고 0건의 비약 금지, 지역/단지 반경별 동적 파일명
3. 선택적으로 Location Report에 PPTX를 추가해 HTML과 같은 basename, MCP 재호출 0회, `audit.json.generatedFiles` 갱신 확인

원격 push·PR은 사용자 지시에 따라 오늘 작업이 모두 끝날 때까지 보류한다.
