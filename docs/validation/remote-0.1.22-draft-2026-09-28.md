# Remote 0.1.22 Draft 검증

검증일: 2026-09-28

## 변경 범위

- Remote Skill payload를 활성 3종으로 축소
- 기존 보관 대상 Skill 24종과 더 이상 사용하지 않는 공용 artifact 3개 제거
- Skill PR #25 병합 커밋 `3c46030e15deea985cbbbe94d02ddba2d45b1dd9` 잠금
- Remote MCP PR #178 병합 커밋 `bc7a7b164e06b7209602c84fb18e0ade98d6a665`을 운영 배포 대상으로 잠금
- 대표 MCP 주소를 `https://ipji-talk.com/mcp`로 전환하고 기존 주소는 서버 호환 경로로 유지
- Remote 0.1.22, Claude launcher 0.1.8, Codex launcher 0.1.9로 갱신하고 Local 0.1.2는 유지
- 공개 도구 10종과 한국시간 기준 일일 500회·무크레딧 계약 반영
- 각 Skill 폴더에 자체 포함된 HTML renderer를 패키징
- launcher와 Remote manifest·설치 안내·README의 Skill 수를 3종으로 동기화

## 검증 결과

아래 명령이 통과했다.

```text
node scripts/sync-skills.mjs --source /private/tmp/ipzitalk-skill-pr25-sync-20260928
Synced 3 skills and 0 artifacts from 3c46030e15deea985cbbbe94d02ddba2d45b1dd9.
```

```text
node scripts/validate-package.mjs
Ipzi Talk package validation passed.
```

```text
claude plugin validate --strict plugins/ipzitalk
claude plugin validate --strict plugins/ipzitalk-remote
claude plugin validate --strict plugins/ipzitalk-local

세 플러그인 모두 Validation passed.
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

Remote MCP PR #178 병합 뒤 별도의 깨끗한 clone에서 운영 배포 사전 검증을 다시 수행했다.

```text
npm run typecheck
npm run build
npx wrangler deploy --dry-run

모두 통과했다.
```

```text
npm test

102개 파일, 1,047개 테스트 통과
1개 파일, 13개 테스트 skipped
4개 테스트 todo
```

최초 `npm test`는 샌드박스의 로컬 포트 listen 권한 오류(`EPERM`)로 D1 통합 테스트 준비 단계에서 실패했고, 같은 명령을 필요한 권한으로 재실행해 통과했다. Wrangler dry-run은 샌드박스 밖 로그 파일 기록에 `EPERM` 경고가 있었지만 번들 생성과 운영 바인딩 해석을 완료하고 exit code 0으로 종료했다.

운영 주소의 비인증 연결 표면을 읽기 전용으로 확인했다.

```text
https://ipji-talk.com/mcp                                      -> 401, redirect 없음
https://ipji-talk.com/.well-known/oauth-protected-resource/mcp -> resource와 authorization_server가 ipji-talk.com
https://ipzi-talk.synergylabs.kr/mcp                           -> 401, redirect 없음
기존 주소의 OAuth metadata                                    -> 기존 origin 유지
```

테스트 실행 뒤 `__pycache__`가 생긴 별도 Skill worktree를 동기화 소스로 전달했을 때는 `locked Skill source is dirty`로 중단됐다. 최종 동기화는 비추적 파일이 없는 새 worktree에서 수행했다.

## 미실행·남은 게이트

- `plugin-creator`의 `validate_plugin.py`는 현재 Python 환경에 PyYAML이 없어 `ModuleNotFoundError: yaml`로 실행하지 못했다. 새 의존성은 설치하지 않았다.
- Remote MCP PR #178 병합 커밋은 아직 운영 배포가 확인되지 않았다. Cloudflare Version ID와 운영 호출·OAuth E2E는 확인하지 않았다.
- 운영 배포 뒤 실제 배포 커밋과 Version ID를 확인하고, 일치할 때만 Draft를 해제한다.
- Draft 플러그인을 marketplace에 재설치하거나 cachebuster를 추가하지 않았다.
- 이 변경은 Draft PR까지만 생성하며 병합·플러그인 공개·Remote MCP 배포는 하지 않는다.
