# Remote 0.1.14 release lock 검증

- 검증일: 2026-07-15
- 작업 브랜치: `chore/relock-skill-release-2026-07-15`
- 상태: 로컬 구현·검증 완료, push·PR·사용자 프로필 설치는 수행하지 않음

## release lock

- Skill 원본: `ipzitalk-skill` 병합 SHA `575ab5514f055f1c8835102e1ebc9267f0330a89`
- Remote MCP: 병합·운영 배포 SHA `8c5602b00d2086a30c9e7e4f1dd302b8da6669e9`
- Remote 플러그인: `0.1.14`
- 패키지: 전체 27개 Skill(메인 6 + 서브 21), HTML 템플릿 26개, 공통 artifact 3개
- Skill 원본 접근성: 병합된 비공개 저장소 커밋(`private-release`)

`source-lock.json`은 Skill별 버전과 `main/`·`sub/` 원본 경로를 모두 기록한다. 동기화 스크립트는 원본 HEAD가 잠긴 SHA와 정확히 일치할 때만 복사하고, 27개 대상 디렉터리와 공통 artifact의 해시를 비교한다.

## 체크포인트

- RED `1d0952f`: Remote release가 27개 Skill, 메인 6개, 서브 21개, 템플릿 26개를 요구하도록 패키지 검증 계약 추가
- GREEN `e9128d0`: Skill 병합 SHA 재잠금, Remote MCP SHA 갱신, 27개 전체 동기화, Remote `0.1.14` manifest·marketplace·설치 문서 갱신
- RED `5ec7a25`: 패키지 안의 `.DS_Store`를 거부하는 회귀 계약 추가
- GREEN `251cd09`: 원본 SHA에 추적된 `sub/ipzitalk-announcement-search/.DS_Store`를 release lock 제외 목록에 기록하고 동기화 결과에서 제거

## 검증 결과

다음 검증을 통과했다.

```text
node --test tests/*.test.mjs
node scripts/validate_namespace_compat.mjs
node scripts/sync-skills.mjs --source /Users/synergylabs/Documents/GitHub/ipzitalk-skill
node scripts/validate-package.mjs
claude plugin validate --strict .
claude plugin validate --strict plugins/ipzitalk-remote
git diff --check
```

- Skill 정본 테스트: 57/57 PASS
- namespace validator: MCP 의존 Skill 24개 PASS, 메인 Skill 추가 계약 포함
- 패키지 validator: PASS
- Claude marketplace·Remote plugin strict validation: PASS
- Skill 27개·템플릿 26개·artifact 3개 source/target 차이: 0건
- 플러그인 심볼릭 링크: 0건
- 개인 절대경로·legacy MCP URL·placeholder·비밀 의심값: 0건
- 패키지 `.DS_Store`: 0건

## 남은 gate

- Claude·Codex 사용자 프로필에 Remote `0.1.14`를 설치하고 새 세션에서 27개 Skill 노출을 확인한다.
- 메인 6개는 기존 E2E 증빙을 유지하되, 27개 확대에 따른 대표 서브 Skill 호출을 새 세션에서 확인한다.
- `ipzitalk-announcement-search`와 `ipzitalk-presale-compare-card`는 직접 MCP 도구명이 없어 24개 MCP 의존 Skill 탐지 집합에는 포함되지 않는다. 지원 상태에서는 Remote와 Local을 동시에 활성화하지 않는 설치 계약으로 출처 충돌을 막고, 공개 전에는 두 Skill의 명시적 provenance 규칙 필요 여부를 재검토한다.
- Skill 원본 저장소에 추적된 `.DS_Store` 정리는 별도 Skill 변경으로 처리한다. 현재 플러그인 동기화는 해당 파일을 명시적으로 제외한다.
- 실제 브라우저에서 운영 지도 픽셀과 CSP 콘솔 위반 0건을 확인하기 전에는 강제 CSP로 전환하지 않는다.
- 사용자 지시에 따라 이 작업에서는 push와 PR을 생성하지 않는다.
