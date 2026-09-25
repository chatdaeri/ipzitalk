# Remote 0.1.21 Draft 검증

검증일: 2026-09-23

## 변경 범위

- Remote Skill payload를 활성 3종으로 축소
- 기존 보관 대상 Skill 24종과 더 이상 사용하지 않는 공용 artifact 3개 제거
- Skill PR #25 head `ba9407e11885294dfefa95e21fdf89730ecee5de` 임시 잠금
- Remote MCP PR #175 병합 커밋 `e0291ccf6e7dc25b817a7497837206d4cd696448` 잠금
- 공개 도구 10종과 한국시간 기준 일일 500회·무크레딧 계약 반영
- 각 Skill 폴더에 자체 포함된 HTML renderer를 패키징
- launcher와 Remote manifest·설치 안내·README의 Skill 수를 3종으로 동기화

## 검증 결과

아래 명령이 통과했다.

```text
node scripts/sync-skills.mjs --source /private/tmp/ipzitalk-skill-pr25-sync
Synced 3 skills and 0 artifacts from ba9407e11885294dfefa95e21fdf89730ecee5de.
```

```text
node scripts/validate-package.mjs
Ipzi Talk package validation passed.
```

```text
claude plugin validate --strict plugins/ipzitalk-remote
Validation passed
```

```text
# Skill PR #25 clean worktree
node scripts/validate_namespace_compat.mjs
node --test tests/*.test.mjs
git diff --check

Namespace compatibility validation passed.
72 tests passed, 0 failed.
git diff --check passed.
```

플러그인 저장소에서도 `git diff --check`가 통과했다.

테스트 실행 뒤 `__pycache__`가 생긴 별도 Skill worktree를 동기화 소스로 전달했을 때는 `locked Skill source is dirty`로 중단됐다. 최종 동기화는 비추적 파일이 없는 새 worktree에서 수행했다.

## 미실행·남은 게이트

- `plugin-creator`의 `validate_plugin.py`는 현재 Python 환경에 PyYAML이 없어 `ModuleNotFoundError: yaml`로 실행하지 못했다. 새 의존성은 설치하지 않았다.
- Skill PR #25가 아직 열려 있으므로 Draft 해제 전에 실제 병합 SHA로 `source-lock.json`과 패키지를 다시 동기화해야 한다.
- Remote MCP PR #175는 병합됐지만 운영 배포하지 않았다. 운영 호출·OAuth·일일 한도 E2E는 실행하지 않았다.
- Draft 플러그인을 marketplace에 재설치하거나 cachebuster를 추가하지 않았다.
- 이 변경은 Draft PR까지만 생성하며 병합·플러그인 공개·Remote MCP 배포는 하지 않는다.
