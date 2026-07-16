# OSS npm 게시 전 자동 검증 — 2026-07-16

- Decision: 류호윤 + Codex
- 대상 저장소: `presale-mcp-oss`
- 검증 기준: 원격 `main` `a78e7cebbf3fd154b18dfa6fbd1e91142399f8bd`
- 패키지 후보: `presale-mcp@0.1.0`
- 게시·API 키 입력·실사용자 모드 전환: 수행하지 않음

## 검증 방법

현재 로컬 작업 브랜치를 바꾸지 않고 원격 최신 `main`을 `/tmp` 격리 사본으로 추출했다. 기존 `node_modules`를 읽기 전용 심볼릭 링크로 사용한 첫 Vitest 시도는 Vite 임시 설정 파일 쓰기 권한 오류로 시작하지 못했다. 코드 실패가 아니므로 의존성 폴더를 격리 사본 안으로 복제한 뒤 같은 테스트를 다시 실행했고 전체 통과했다. 새 의존성은 설치하지 않았다.

## 결과

```text
npm run typecheck
PASS

npm test
18 files, 149 tests passed

npm run build
PASS
dist/index.js 163.22 KB

node scripts/smoke-stdio.mjs
PASS, tools/list 10개

vitest run tests/tool-result.test.ts
1 file, 4 tests passed

npm pack --dry-run --json
PASS
```

stdio 도구 목록은 다음 10개다.

1. `get_address`
2. `get_announcement_detail`
3. `get_complex_info`
4. `get_complex_trades`
5. `get_geocode`
6. `get_region_code`
7. `get_static_map`
8. `search_by_nearby_category`
9. `search_by_nearby_keyword`
10. `search_presale_announcements`

오류 응답 전용 회귀 4건이 통과했다. `isError: true`인 오류 결과는 텍스트 오류와 `isError`를 유지하고 성공 응답용 `structuredContent`를 포함하지 않는다.

dry-run 패키지는 다음 4개 파일만 포함한다.

- `dist/index.js`
- `README.md`
- `LICENSE`
- `package.json`

`dist/index.js`는 `#!/usr/bin/env node` shebang과 실행 권한을 가진다. dry-run은 tarball을 생성하지 않았다. 패키지 포함 범위에서 실제 비밀 리터럴·private key·토큰 의심값은 0건이다. 소스 테스트의 `fake-secret`, `kakao-key` 등 명시적 가짜 fixture는 npm 패키지에 포함되지 않는다.

## npm registry 확인

2026-07-16 조회 시 `npm view presale-mcp version --json`은 E404를 반환했다. 즉 조회 시점에 공개 패키지가 등록돼 있지 않다. 이름은 게시 전까지 예약되지 않으므로 실제 게시 직전에 다시 확인한다.

## 남은 수동·승인 항목

1. npm 로그인 계정과 게시 대상을 사용자와 확인
2. 게시 직전 `presale-mcp` 이름 재조회
3. 사용자 승인 후 `npm publish`
4. 깨끗한 npm cache에서 registry 설치본 실행
5. 별도 프로필에서 sensitive API 키 4개를 사용자가 직접 입력
6. Local 도구 10개와 실제 외부 API 대표 호출
7. Remote→OSS 전환과 OSS→Remote 복구

현재 자동 검증 결과만으로 npm 게시·공개 베타 완료를 선언하지 않는다.

## 후속 상태

2026-07-16 사용자 승인 후 `presale-mcp@0.1.0` 게시와 깨끗한 registry 설치 검증을 완료했다. 후속 증빙은 `docs/validation/oss-registry-0.1.0-2026-07-16.md`에 기록한다.
