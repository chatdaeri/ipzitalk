# Remote 0.1.15 서브 Skill 산출물 계약 검증

- 날짜: 2026-07-15
- Decision: 류호윤 + Codex
- 상태: Remote `0.1.15` 배포 후보. 로컬 구현·정적 검증과 Claude·Codex 사용자 프로필 설치 완료, 새 세션 실행 검증 대기
- push·PR·배포: 수행하지 않음

## 변경 범위

- `ipzitalk-skill` 로컬 체크포인트: `d3b0b55af75bd379e8d277114449addec701b384`
- Remote 플러그인: `0.1.15`
- 동기화 대상: Skill 27개, 공통 artifact 3개
- 변경된 서브 Skill:
  - Find Fit `1.0.1`
  - Parking Ranking `1.0.4`
  - Presale Compare Card `1.0.2`
  - Price Trend `1.2.5`
  - Transit Environment `1.0.1`

아직 원격에 게시되지 않은 체크포인트를 잠갔으므로 `source-lock.json`의 availability는 `local-checkpoint`로 기록한다. 이번 Skill 보강을 배포 범위에 포함하며, 리뷰·병합 후 실제 병합 SHA로 다시 잠글 때 `private-release`로 전환한다.

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

node scripts/sync-skills.mjs --source /Users/synergylabs/Documents/GitHub/ipzitalk-skill
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

## 남은 새 세션 검증

1. Parking Ranking을 같은 입력으로 다시 실행해 고정 template prefix·suffix와 iframe 보안 속성을 확인한다.
2. 대표 서브 5종이 정해진 동적 사용자 파일명으로 생성되는지 확인한다.
3. `audit.json.generatedFiles`가 실제 상대경로와 일치하는지 확인한다.
4. 새 세션 검증이 통과하면 `ipzitalk-skill` 변경을 push하고 PR을 생성한다.
5. Skill PR 병합 SHA로 `source-lock.json`을 다시 잠근 뒤 Remote 플러그인 PR을 생성한다.
