# Ipzi Talk

Codex와 Claude Code용 입지톡 플러그인 marketplace입니다.

> 내부 비공개 배포 단계: 이 저장소는 아직 공개 설치용이 아닙니다. Skill source lock(소스 잠금)은 비공개 저장소의 병합 커밋을 가리키며, OSS npm 패키지는 아직 게시되지 않았습니다.

## 구성

- `ipzitalk`: 업무용 MCP 없이 설치·전환만 담당하는 설정 launcher입니다.
- `ipzitalk-remote`: OAuth 기반 호스팅 MCP와 잠긴 Remote Skill 27개(메인 6개 + 서브 21개)를 제공합니다.
- `ipzitalk-local`: Node.js로 실행되는 MCP 전용 OSS 패키지입니다. 도구 10개를 제공하고 Skill은 포함하지 않으며 MCP 서버 ID와 npm 패키지명은 `presale-mcp`입니다.

setup Skill은 `Remote(호스팅형·권장)`, `OSS(로컬 실행)`, `상태만 확인`을 한국어로 제시하고 실행 방식 하나만 선택하게 합니다. 플랫폼의 플러그인 목록에서 상태를 판정하며 별도 상태 파일을 만들거나 무관한 MCP 서버를 변경하지 않습니다.

Remote를 선택하면 CLI setup은 브라우저 로그인을 시작할지 한 번 묻고 플랫폼 공식 명령(`codex mcp login ipzitalk` 또는 `claude mcp login plugin:ipzitalk-remote:ipzitalk`)을 실행합니다. 인증 URL을 직접 만들거나 기록하지 않습니다. Desktop에서는 새 로컬 세션을 연 뒤 플랫폼의 연결·로그인 버튼 또는 첫 Remote Skill 호출에서 나타나는 인증 prompt를 사용합니다.

## 지원 범위

| 실행 환경 | Remote | OSS | 실행 방법과 현재 경계 |
|---|---|---|---|
| Codex CLI | 0.1.15 기능 검증 완료, 0.1.16 한국어·인증 흐름 재검증 대기 | 조건부·CLI 전용 | `$ipzitalk:setup`을 사용합니다. OSS는 npm 게시와 registry 설치 검증이 남아 있습니다. |
| Codex Desktop 로컬 workspace | Remote 기능 검증 완료, 0.1.16 한국어·인증 흐름 재검증 대기 | 지원하지 않음 | 플러그인 변경 후 새 로컬 세션을 엽니다. Finder/Dock 실행 환경의 안전한 OSS 비밀값 전달은 검증되지 않았습니다. |
| Claude Code CLI | Remote 기능 검증 완료, 0.1.16 한국어·인증 흐름 재검증 대기 | registry 검증 대기 | `/reload-plugins`, `/ipzitalk:setup`, `/mcp`를 사용합니다. |
| Claude Desktop 로컬 Code 탭 | Remote 기능 검증 완료, 0.1.16 한국어·인증 흐름 재검증 대기 | 별도 프로필 registry 검증 대기 | `+` → `Plugins`와 새 로컬 세션을 사용합니다. CLI 전용 namespace 문자열을 슬래시 명령처럼 직접 입력하지 않습니다. |
| Claude Desktop Chat 또는 Cowork | 범위 밖 | 범위 밖 | Claude Code 플러그인 실행 환경이 아닙니다. |
| Claude remote/web 세션 | 범위 밖 | 범위 밖 | 현재 플러그인 계약은 로컬 Claude Code 세션만 다룹니다. |

위 검증 결과는 비공개 내부 검증을 뜻하며 공개 지원을 약속하지 않습니다. 격리된 진단 프로필 외에는 Remote와 OSS를 동시에 활성화하지 않습니다. Codex와 Claude의 명령 형식이 다른 이유는 각 플랫폼의 플러그인 인터페이스가 다르기 때문이며 저장소 공개 여부와는 무관합니다. 자세한 내용은 [플랫폼 지원 범위 문서](docs/platform-support-matrix.md)를 참고하세요.

## Codex 설정

저장소 marketplace와 launcher를 설치하고 새 Codex 프로세스에서 `$ipzitalk:setup`을 직접 실행합니다.

```bash
codex plugin marketplace add /path/to/ipzitalk --json
codex plugin add ipzitalk@ipzitalk --json
```

Remote는 `https://ipzi-talk.synergylabs.kr/mcp`, OAuth, 호스팅 데이터, 패키지 Skill 27개를 사용합니다. OSS는 `npx -y presale-mcp@0.1.0`을 실행하고 현재 Codex 프로세스에 이미 존재하는 다음 환경변수 이름만 전달합니다.

- `KAKAO_REST_API_KEY`
- `NAVER_MAPS_CLIENT_ID`
- `NAVER_MAPS_CLIENT_SECRET`
- `DATA_GO_KR_SERVICE_KEY`

실제 값을 채팅·플러그인 명령·manifest·커밋 파일에 붙여 넣지 마세요. OSS는 현재 Codex CLI에서만 조건부로 지원합니다. Finder나 Dock에서 실행한 Codex Desktop 프로세스가 셸 환경변수를 상속한다고 가정하지 않습니다.

선택·OAuth·전환·업데이트·완전 제거 절차는 [Codex 설정 및 수명주기](docs/codex-setup.md)를 참고하세요.

## Claude Code 설정

Claude Code CLI에서는 저장소 marketplace와 launcher를 설치한 뒤 `/reload-plugins`를 실행합니다. launcher는 `/ipzitalk:setup`으로 실행합니다. 선택한 실행 패키지를 설치한 뒤 `/reload-plugins`를 다시 실행하고 `/mcp`에서 상태를 확인합니다.

Claude Desktop 로컬 Code 탭에서는 `+` → `Plugins`에서 marketplace를 관리하고 설치된 Skill을 실행합니다. `ipzitalk` → `setup` 또는 `ipzitalk-remote` 아래의 필요한 Skill을 선택하세요. CLI namespace를 슬래시 명령으로 직접 붙여 넣지 않습니다. Code 탭에는 `/reload-plugins`가 없으므로 플러그인 변경 후 새 로컬 세션에서 launcher와 선택한 실행 패키지를 확인합니다. Desktop Chat·Cowork·remote 세션 결과를 Code 탭 검증으로 간주하지 않습니다.

Claude OSS 키 4개는 필수·sensitive `userConfig` 값으로 Claude Code 보안 저장소에 저장됩니다. 플러그인 설정 UI에만 직접 입력하고 비밀값에 `--config KEY=value`를 사용하지 마세요. 자세한 내용은 [Claude Code 설정 및 수명주기](docs/claude-setup.md)를 참고하세요.

## 검증

```bash
node scripts/validate-package.mjs
claude plugin validate --strict .
python3 /path/to/plugin-creator/scripts/validate_plugin.py plugins/ipzitalk
python3 /path/to/plugin-creator/scripts/validate_plugin.py plugins/ipzitalk-remote
python3 /path/to/plugin-creator/scripts/validate_plugin.py plugins/ipzitalk-local
```

마지막 Python 명령 3개는 설치된 `plugin-creator` 검증기와의 호환성을 확인합니다. 누락된 Python 의존성을 승인 없이 설치하지 않습니다.
