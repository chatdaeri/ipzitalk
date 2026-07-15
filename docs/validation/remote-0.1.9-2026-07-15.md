# Remote 0.1.9 목적 확인·실데이터 후속 추론 검증

검증일: 2026-07-15

## 배경

Remote `0.1.8`의 `ipzitalk-recent-market-trend` 실행은 앞선 대화에서 사용자가 투자 목적을 이미 밝혔으므로 목적을 다시 묻지 않은 것이 정상이다. 이를 목적 미제공으로 본 최초 판정은 사용자 확인 후 철회했다. 실제 결함은 서초구 2026년 4월 최초 응답을 구조화하지 못한 뒤 Skill 문서의 2026-07-09 검증값을 실행값으로 대체하고 `auditIncomplete:true` 상태에서 완성 리포트로 보고한 것이다.

목적 재질문 생략은 결함이 아니지만, 메인 Skill 승격 과정에서 목적 확인 규칙이 짧게 축약돼 새 세션의 실행 경계가 모호해진 점은 별도로 보강했다.

- 목적 미제공 시 질문만 출력하고 해당 턴을 종료한다.
- 사용자가 목적 또는 명시적인 건너뛰기로 답하기 전에는 MCP·웹·파일·셸 도구를 호출하지 않는다.

## 변경 범위

`ipzitalk-skill` 커밋 `0454bc335e22c17a3e176d889523aadc2749ed35`를 잠그고 Remote 버전을 `0.1.9`로 올렸다. 메인 Skill 6개에 다음 공통 계약을 적용했다.

- 목적이 없으면 정해진 질문을 한 번만 출력하고 턴을 종료해 답을 기다린다.
- 사용자가 건너뛰겠다고 답한 경우에만 `goal:null`로 진행한다.
- `purpose`에는 사용자의 문장을 그대로 보존한다.
- 데이터 조회·수집 완료 후에만 `conclusions`, `evidence`, `cautions`, `nextActions`를 작성한다.
- 근거는 이번 실행에서 확보한 필드·수치·비교 결과로만 구성한다.
- 주의사항은 실제 누락·표본 한계·시점 차이·방법상 제약으로만 구성한다.
- 다음 행동은 실제 발견사항·누락·사용자 목적에서 이어지는 검토 행동만 제안한다.
- 예시·검증값·모델 지식으로 새 데이터나 없는 수치를 만들지 않는다.

`ipzitalk-recent-market-trend`에는 다음 무결성 규칙도 추가했다.

- 문서의 검증된 사항은 회귀 참고 전용이며 런타임 fallback(실행값 대체)에 사용하지 않는다.
- 최초 반환을 구조화하지 못하면 호출 원장과 지표를 `null`로 기록한다.
- `auditIncomplete:true`이면 정상 완료를 주장하지 않고 부분 완료 또는 실패로 보고한다.

패키지 Skill 버전은 다음과 같다.

- `ipzitalk-complex-overview-all` `1.1.1`
- `ipzitalk-location-report` `1.3.2`
- `ipzitalk-presale-report` `1.1.1`
- `ipzitalk-read-notice-compare` `1.2.2`
- `ipzitalk-read-notice-report` `1.2.2`
- `ipzitalk-recent-market-trend` `1.2.2`

## 검증 결과

- 목적·실행값 무결성 계약의 실패 테스트(RED): 의도한 2건 실패 확인
- 구현 후 해당 계약 테스트: 12/12 통과
- `node --test tests/*.test.mjs`: 42/42 통과
- `node scripts/validate_namespace_compat.mjs`: MCP 의존 Skill 24개 통과
- `node scripts/validate-package.mjs`: 통과
- `claude plugin validate --strict .`: 통과
- `claude plugin validate --strict plugins/ipzitalk-remote`: 통과
- Skill 6개 source/target `diff -qr`: 차이 0건
- `git diff --check`: 통과

Codex용 Python 플러그인 validator는 환경에 PyYAML이 없어 `ModuleNotFoundError: No module named 'yaml'`로 시작하지 못했다. 검증만을 위한 새 의존성은 설치하지 않았다.

## 설치와 새 세션 검증

- Codex 사용자 프로필: `ipzitalk-remote@ipzitalk` `0.1.9` 설치 확인
- Claude 사용자 프로필: `0.1.8`에서 `0.1.9`로 갱신 확인, 재시작 후 적용 필요
- Local payload: 설치하지 않음

목적이 없는 새 Codex 세션에서 다음 요청을 실행했다.

> 서초구, 강남구, 송파구 조사 자료 만들어줘.

세션은 아래 질문 한 문장만 출력하고 종료했다.

> 원하는 분석 목적을 한 문장으로 알려주세요. (예: "4인가족 실거주 검토", "투자 심의 회의 자료", "분양 제안서용 자료") 건너뛰셔도 됩니다.

해당 턴의 이벤트에는 명령·파일·웹·MCP 호출이 0건이었다. 따라서 목적 확인 전 조회 금지 계약은 실제 새 세션에서 통과했다.

목적을 명시한 별도 E2E는 임시 작업 디렉터리가 Git 저장소가 아니어서 산출물 생성 전에 중단됐다. 이 실행은 성공으로 세지 않으며, 목적 명시 후 완성 리포트의 `goal` 데이터와 실제 조회값 연결 검증은 다음 테스트로 남긴다.

## 판정

Remote `0.1.9`는 목적 미제공 시 질문 후 대기하는 실행 경계와, 메인 Skill 6개의 실데이터 후속 추론 계약을 패키지에 반영했다. 정적·회귀·패키지 검증과 목적 미제공 새 세션 검증은 통과했다. 목적 명시 완성 리포트 E2E, Claude 재시작 후 동일 질문 대기 검증, 실제 브라우저 렌더 검증은 남아 있으므로 공개 배포 완료로 판정하지 않는다.
