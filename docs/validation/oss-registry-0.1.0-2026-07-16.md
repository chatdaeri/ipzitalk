# OSS registry `0.1.0` 게시·설치 검증 — 2026-07-16

- Decision: 류호윤 + Codex
- 패키지: `presale-mcp@0.1.0`
- 소스 기준: `presale-mcp-oss` 원격 `main` `a78e7cebbf3fd154b18dfa6fbd1e91142399f8bd`
- npm 계정: `npm whoami` 성공 여부만 확인했으며 계정 토큰·OTP는 기록하지 않음

## 게시 결과

사용자 승인 후 `npm publish`를 실행해 `presale-mcp@0.1.0` 게시에 성공했다. npm 웹 인증은 공식 CLI 흐름으로 완료했으며 인증 주소·코드·토큰은 문서에 기록하지 않았다.

registry 조회 결과는 다음과 같다.

```text
name: presale-mcp
version: 0.1.0
shasum: 3553e87f5f08cd52fc1b189c808d3245b017b618
```

registry shasum은 게시 전 `npm pack --dry-run`과 실제 `npm publish --dry-run`의 shasum과 일치한다.

## 깨끗한 registry 설치 검증

별도 npm cache에서 다음 실행 경로를 검증했다.

```text
npx -y presale-mcp@0.1.0
```

MCP initialize와 `tools/list`가 성공했고 다음 10개 도구가 노출됐다.

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

API 키 4개를 명시적으로 비운 상태에서 `get_geocode`를 호출해 다음 오류 계약을 확인했다.

- `isError: true`
- 텍스트 오류 유지
- `structuredContent` 없음
- stdout JSON-RPC 채널 오염 없음

게시 직후 자동 검증 단계에서는 실제 API 키를 사용한 외부 API 호출을 수행하지 않았다. 이후 Claude Code CLI의 격리 프로필에서 사용자가 sensitive 설정 UI에 키 4개를 직접 입력해 실제 호출을 검증했다.

## 패키지 내용

게시된 패키지는 다음 4개 파일만 포함한다.

- `dist/index.js`
- `README.md`
- `LICENSE`
- `package.json`

게시 전 자동 검증에서 실제 비밀 리터럴 0건과 실행 shebang·권한을 확인했다. 상세 자동 검증은 `docs/validation/oss-prepublish-2026-07-16.md`를 참조한다.

## 다음 단계

1. 팀원 npm 사용자명을 확인한 뒤 `npm owner add <team-user> presale-mcp`
2. `npm owner ls presale-mcp`로 복수 소유자 확인
3. `source-lock.json`의 Local 소스 SHA를 `a78e7ce`로 갱신하고 availability를 registry 게시 상태로 전환
4. setup Skill과 설치 문서의 “게시 전” 문구 제거
5. 관련 플러그인 버전·validator 갱신 후 package·strict 검증
6. 별도 프로필에서 사용자가 sensitive API 키 4개를 직접 입력
7. Local 도구 10개 실제 호출과 Remote→OSS→Remote 복구 검증

게시 성공만으로 Local 사용자 E2E 또는 공개 베타 완료를 선언하지 않았다. 아래 후속 검증에서 Claude Code CLI Local E2E와 전환 복구를 별도로 확인했다.

## 플러그인 잠금·격리 설치 후속 — 2026-07-16

팀원 npm 사용자 `chatdaeri`가 초대를 수락해 `npm owner ls presale-mcp`에서 기존 소유자와 함께 확인됐다. 기존 소유자는 복구 안전을 위해 유지한다.

플러그인 계약은 다음과 같이 갱신했다.

- launcher: `0.1.3`
- Remote: `0.1.16` 유지
- Local: `0.1.2` 유지
- Local source SHA: `a78e7cebbf3fd154b18dfa6fbd1e91142399f8bd`
- Local availability: `public-registry`
- setup Skill: 게시 전 경고를 제거하고 registry 10도구·키 누락 오류 검증과 실제 키 E2E 대기를 구분

검증 결과:

```text
node scripts/validate-package.mjs
PASS

claude plugin validate --strict .
claude plugin validate --strict plugins/ipzitalk
claude plugin validate --strict plugins/ipzitalk-remote
claude plugin validate --strict plugins/ipzitalk-local
PASS (4/4)
```

`/tmp` 격리 Codex·Claude 프로필에서 launcher `0.1.3` 설치와 새 setup 본문 적재를 확인했다. 두 프로필에 Local `0.1.2`를 설치한 결과:

- Codex: `presale-mcp` stdio, `npx -y presale-mcp@0.1.0`, 환경변수 이름 4개, 값 없음
- Claude: `presale-mcp` stdio, 같은 registry 명령, required userConfig 4개 미설정 안내, `${user_config.*}` 참조만 존재
- Local Skill 디렉터리: 양쪽 모두 0개
- Remote payload: 격리 Local 검증 프로필에 설치하지 않음

Python `quick_validate.py`와 `validate_plugin.py`는 기존 환경에 PyYAML이 없어 시작하지 못했다. 의존성은 설치하지 않았고 package validator와 Claude strict 검증으로 계약을 확인했다.

위 목록의 1~7은 완료됐다. 전체 플랫폼 공개 베타와 Codex Desktop OSS 지원은 별도 범위다.

## Claude Code CLI Local E2E·전환 복구 — 2026-07-16

사용자는 격리된 Claude Code CLI 프로필에서 플러그인 설정 UI의 sensitive 필드에 API 키 4개를 직접 입력했다. 값은 채팅·명령 인자·문서에 기록하지 않았다.

실제 Local provenance `plugin:ipzitalk-local:presale-mcp`로 다음 외부 경로를 확인했다.

- `get_address`: Kakao 주소 검색 성공
- `get_geocode`: Naver 좌표와 법정동코드 보강 성공
- `get_static_map`: Naver 정적 지도 성공
- `search_presale_announcements`: 공공데이터 분양공고 조회 성공

전환 회귀는 다음 순서로 통과했다.

1. Remote 단독 상태에서 Local로 전환
2. `/reload-plugins` 후 Local sensitive 설정과 실제 호출 확인
3. Local 제거 후 Remote `0.1.16` 재설치
4. Remote와 Local 동시 활성화 없음 확인
5. 별도 브라우저 재로그인 없이 기존 OAuth 인증 재사용
6. Remote 대표 호출 성공

설치 직후 configure 명령은 플러그인 재로딩 전 `not installed in this project`로 실패했고, `/reload-plugins` 후 정상 저장됐다. 따라서 Claude Code CLI의 Local 설치 순서는 `설치 → /reload-plugins → configure → /reload-plugins`로 고정한다.

Claude 내부 비대화형 셸에서 공식 OAuth 로그인 명령을 실행하면 브라우저 자동 실행과 로컬 콜백 완료가 안정적이지 않았다. 향후 첫 로그인은 외부 대화형 터미널에서 공식 명령을 실행하고, 콜백 URL·인가 코드·state를 채팅에 전달하지 않는 흐름을 기본으로 한다.

이 실증을 반영한 setup UX 후보는 launcher `0.1.4`다. Remote `0.1.16`과 Local `0.1.2`는 변경하지 않는다.

별도 `/tmp` Codex·Claude 프로필에 launcher `0.1.4`만 설치해 양쪽 cache의 setup 본문과 버전을 확인했다. 설치가 Remote 또는 Local payload를 자동으로 추가하지 않는 것도 함께 확인했다.

서울 조건 분양공고 요약에 표시된 인천 공고 1건은 단일 원본 호출에서도 재현됐다. 해당 공고의 복합 사업지 주소 뒤쪽에 서울 강서구가 포함돼 청약홈 `HSSPLY_ADRES::LIKE` 조건에 매칭된 것으로, 원천 레코드 오염이나 Claude 요약 혼입은 아니다. 대표 행정구역 조회와 주소 전체 부분 일치의 의미 차이는 OSS·Remote 공통 MCP 후속 기능 개선으로 분리하며 이번 설치·전환 PASS에는 영향을 주지 않는다.
