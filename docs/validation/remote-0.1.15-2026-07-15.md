# Remote 0.1.15 서브 Skill 산출물 계약 검증

- 날짜: 2026-07-15
- Decision: 류호윤 + Codex
- 상태: Skill PR 병합 SHA 재잠금·정적 검증·대표 새 세션 회귀 완료, 플러그인 PR 준비
- push·PR·배포: 수행하지 않음

## 변경 범위

- `ipzitalk-skill` PR: [#19](https://github.com/chatdaeri/ipzitalk-skill/pull/19), 병합 SHA `3e2c004d3089dbbc2ef33d1da7341df024d680f2`
- Remote 플러그인: `0.1.15`
- 동기화 대상: Skill 27개, 공통 artifact 3개
- 변경된 서브 Skill:
  - Find Fit `1.0.1`
  - Parking Ranking `1.0.4`
  - Presale Compare Card `1.0.2`
  - Price Trend `1.2.5`
  - Transit Environment `1.0.1`

Skill PR #19의 실제 병합 SHA를 잠갔으며 `source-lock.json`의 availability는 `private-release`로 기록한다. 로컬 작업 브랜치 SHA를 release lock으로 사용하지 않는다.

## 보강 내용

Parking Ranking은 고정 `templates/result.html`을 사용하고 비실행 `ipzi-data` JSON 블록만 교체하도록 명시했다. 새 HTML 작성, 마크업·CSS·렌더 JS 수정, iframe 보안 속성 제거를 금지했다. 사용자 전달 파일명은 `<기준대상>_주차랭킹.html`로 고정했다.

대표 서브 Skill 5종은 공용 `html_artifact_contract.mjs`와 `--file-name`을 사용하고, 사용자 전달 HTML에 `result.html`·`index.html`을 쓰지 않도록 계약을 통일했다. 내부 `result.json`·`audit.json`·XLSX 파일명은 유지한다.

서브 Skill HTML 템플릿 20개 중 iframe 포함 템플릿 18개를 전수 검사했다. 18개 모두 다음 속성을 이미 포함해 템플릿 수정은 하지 않았다.

- `sandbox="allow-scripts allow-same-origin"`
- `referrerpolicy="strict-origin-when-cross-origin"`

## 검증 결과

```text
node --test tests/*.test.mjs
59 tests, 59 passed

node scripts/sync-skills.mjs --source <ipzitalk-skill-repo>
Synced 27 skills and 3 artifacts

node scripts/validate-package.mjs
PASS

claude plugin validate --strict .
PASS

claude plugin validate --strict plugins/ipzitalk-remote
PASS

git diff --check
PASS
```

- Claude 사용자 프로필: `ipzitalk-remote@ipzitalk` `0.1.15`, enabled, `0.1.15` cache 사용
- Codex 사용자 프로필: `ipzitalk-remote@ipzitalk` `0.1.15`, enabled, 로컬 plugin source 사용
- Claude cache와 저장소 Remote 패키지: 차이 0건
- 패키지 Skill 27개·HTML 템플릿 26개 확인

## AllSkillTest 후속 확인

추가된 Recent Market Trend 산출물로 메인 Skill 6종 실행 커버리지가 완성됐다.

- 동적 파일명: `수지구_기흥구_처인구_시장동향_2026-05.html`
- Remote MCP: 9회 (`get_region_code` 3 + `get_complex_trades` 6)
- `auditIncomplete:false`
- HTML `ipzi-data`와 `result.json`: 구조 일치

## 새 세션 대표 서브 Skill 검증

사용자 결정에 따라 대표 5종 전체를 다시 실행하지 않고 Parking Ranking과 Find Fit 2종으로 범위를 고정했다. `AllSkillTest2` 산출물을 감사한 결과 두 실행 모두 PASS다.

### Find Fit

- 동적 파일명: `의왕시_84㎡_청약맞춤분석.html`
- 고정 template prefix·suffix: 일치
- HTML `ipzi-data`와 `result.json`: 일치
- 대출한도·추정 가능 주택가격 공식 재계산: 일치
- 주택형 5개의 가능/초과 분류와 예산 차이 부호: 일치
- 종료 공고 3건의 가격 참고용 표시: 확인
- 금지 문구·개인 절대경로·비밀값·위험 URL: 0건

### Parking Ranking

- 동적 파일명: `잠실르엘_주차랭킹.html`
- 고정 template prefix·suffix: 일치
- HTML `ipzi-data`와 `result.json`: 일치
- iframe `sandbox`·`referrerpolicy`: 존재
- 지도 URL: 공식 HTTPS `/map?d=<id>` 형식
- 랭킹: 22개, 순번 연속, 세대당 주차 내림차순
- `parking_ground + parking_underground = parking_total` 및 `parking_total / units = per_unit`: 22개 모두 일치
- 검색 기준 잠실르엘: 7위, 1.53대/세대
- 결측 단지 0 처리 금지와 표본 비전수 안내: 확인

두 실행의 `audit.json`에는 `auditIncomplete`와 `generatedFiles`가 없다. 계산·HTML·보안 무결성 문제는 아니며 기존 개선 문서의 감사 원장 최소 스키마 후속 항목으로 유지한다. 이번 Remote `0.1.15` 배포를 차단하지 않는다.

## 다음 단계

1. 전체 Skill·namespace·패키지·Claude strict 검증을 병합 SHA 기준으로 다시 실행한다.
2. 검증이 통과하면 Remote 플러그인 PR을 생성한다.
3. 런처 한국어 선택 안내와 OAuth 시작 경험 개선은 release lock 변경과 분리한 후속 작업으로 진행한다.
