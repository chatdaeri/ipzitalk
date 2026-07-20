# Remote 0.1.17 부분 커버리지 처리 검증

검증일: 2026-07-20

## 변경 범위

- `ipzitalk-recent-market-trend` 1.2.7 동기화
- `PARTIAL_COVERAGE`와 `coverage.complete=false`를 거래 0건과 구분
- `provisional_months` 대상월은 확정 집계·전월 대비 계산에서 제외
- 호출 감사 원장에 reason/coverage 필드 추가
- Remote 플러그인 버전 0.1.17 및 Skill 병합 SHA의 `private-release` 잠금

Remote MCP 소스 잠금은 운영 배포본을 계속 가리킨다. 아직 머지·배포되지 않은 MCP 핫픽스 커밋은 이 패키지 변경에 포함하지 않았다.

## 검증 결과

```text
node scripts/validate-package.mjs
Ipzi Talk package validation passed.
```

```text
node scripts/validate_namespace_compat.mjs
Namespace compatibility validation passed for 24 MCP-dependent skills.
Codex canary resolved server=ipzitalk tool=get_geocode by provenance and base tool name.
```

```text
claude plugin validate --strict plugins/ipzitalk-remote
Validation passed
```

```text
git diff --check
통과
```

## 남은 게이트

- Remote MCP 핫픽스 PR 검토·머지 및 운영 배포
- 배포 후 `NO_TRADES_FOR_REQUESTED_SCOPE`, `PARTIAL_COVERAGE`, 잠정월 대표 입력 실호출 검증
