# Remote 0.1.18 K-apt 코드 거래 조회 검증

검증일: 2026-07-27

## 변경 범위

- `ipzitalk-complex-overview-all` 1.1.6 동기화
- `ipzitalk-price-trend` 1.2.6 동기화
- 매매·전월세 조회를 `kapt_code` 기간 조회로 전환
- 분양권은 `kapt_code` 미지원으로 확정 단지명 조회 유지
- `MAPPING_REVIEW_REQUIRED` 이름 단독 fallback 금지, exact 법정동·전체 지번·K-apt 공식명 제한 조회 허용
- `PARTIAL_COVERAGE`·truncation을 완전한 기간 집계와 구분
- Remote 플러그인 0.1.18 및 Skill 소스 커밋 `ba1ca23c62244211afa0a2e95bd6b95dbef7f581` 잠금

## 검증 결과

```text
node scripts/validate-package.mjs
Ipzi Talk package validation passed.
```

```text
claude plugin validate --strict plugins/ipzitalk-remote
Validation passed
```

```text
node scripts/validate_namespace_compat.mjs
Namespace compatibility validation passed for 24 MCP-dependent skills.
Codex canary resolved server=ipzitalk tool=get_geocode by provenance and base tool name.
```

```text
git diff --check
통과
```

Plugin Creator의 `validate_plugin.py`는 로컬에 PyYAML이 없어 실행하지 않았다. 새 의존성은 설치하지 않았다.

## 운영 MCP smoke

- 검증 매핑 단지: 매매 39건, 전월세 430건의 12개월 범위 조회 성공
- 두 거래유형 모두 `PARTIAL_COVERAGE`를 거래 0건과 구분
- 검토 필요 단지: `kapt_code` 경로의 `MAPPING_REVIEW_REQUIRED` 확인
- 동일 단지의 법정동 `반포동`·전체 지번 `1341`·K-apt 공식명 exact filter로 매매 16건·전월세 107건 확인
- 이름 단독·본번 완화 fallback은 계속 금지
- 분양권: 확정 단지명 예외 경로에서 요청 범위 거래 없음 응답 확인

## 남은 게이트

- Skill PR #22 검토·머지
- Remote 플러그인 PR 검토·머지
- 머지 후 설치본 0.1.18을 새 대화에서 로드해 출처·버전 확인
