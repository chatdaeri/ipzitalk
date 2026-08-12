# Remote 0.1.20 배치 라우팅 및 정확 지번 보완 검증

검증일: 2026-08-12

## 변경 범위

- `ipzitalk-building-age-analysis` 1.0.4 동기화
- `ipzitalk-parking-ranking` 1.0.5 동기화
- `ipzitalk-transit-complex-ranking` 1.0.4 동기화
- 병합된 Skill 정본의 공용 MCP 네임스페이스·출처 규칙을 패키지 전체에 동기화
- 반복 단건 조회를 정보·거래 배치 호출로 전환
- 사용승인일 결측은 무효 배치 재호출 없이 결측으로 유지
- 주차 상세는 `detail=true` 배치 보강 경로 유지
- 정확 지번 보완이 포함된 Remote MCP 병합 커밋 `b85b3fb72709e3acdaff4d90676e1d6a021177c1` 잠금
- Skill PR #23의 실제 병합 커밋 `0932d0effeda0fd6fd406a00abe890181220586a` 잠금

## 운영 MCP 검증

`mcp-testSequencce1`의 배치 라우팅 검증에서 정보 배치 1회와 거래 배치 1회로 10개 단지를 처리했다. 정보 결과는 확정 8건, 모호 2건이었고 모호 항목은 거래 조회나 자동 확정에서 제외됐다. 거래 결과는 검증 완료 7건, 검토 필요 1건이었으며 확인 월이 부족한 항목은 완전 집계로 오인하지 않고 부분 커버리지로 표시됐다.

`mcp-testSequence2`의 정확 지번 보완 검증은 세 실행 모두 50건 단일 호출에서 동일하게 통과했다. 결과는 확정 43건, 모호 7건, 미발견 0건, 오류 0건이며 모호 7건 모두 기대 K-apt 코드를 후보에 포함했다. 정답 도달은 50/50, 오탐과 순서 오류는 0건, `runtime_external_api=false`였다.

검증 결과 파일은 플러그인 저장소 밖의 운영 작업 기록에 보관하며 패키지에는 포함하지 않는다.

## 패키지 검증

아래 명령으로 동기화된 Skill 해시, manifest·marketplace 버전, MCP URL과 금지 항목을 확인했다.

```text
node scripts/sync-skills.mjs --source /private/tmp/ipzitalk-skill-pr5-merged
node scripts/validate-package.mjs
claude plugin validate --strict plugins/ipzitalk-remote
git diff --check
```

과거 검증 문서에 기록된 `scripts/validate_namespace_compat.mjs`는 현재 저장소에 존재하지 않아 실행하지 않았다. 새 의존성은 설치하지 않았다.

## 남은 게이트

- Remote 플러그인 PR 검토·머지
- 머지 후 설치본 0.1.20을 새 대화에서 로드해 출처·버전 확인
