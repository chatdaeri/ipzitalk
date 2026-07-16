---
name: setup
description: 입지톡 Remote 또는 OSS 실행 방식의 설치 상태를 확인하고 설치·전환·제거한다. 사용자가 입지톡 설정을 직접 실행하거나 설치 모드 관리를 요청했을 때만 사용한다.
---

# 입지톡 설정

현재 플랫폼의 플러그인 명령으로만 실행 방식을 관리한다. 설치된 플러그인 목록을 유일한 상태 근거로 사용하며, 별도 상태 파일을 만들거나 플랫폼 설정을 직접 편집하지 않는다.

이 빌드는 내부 검증용이다. OSS 실행체 `presale-mcp@0.1.0`은 npm registry 게시·기계 검증과 Claude Code CLI의 사용자 API 키 Local E2E 및 Remote→OSS→Remote 복구 검증을 통과했다. 이 결과만으로 전체 플랫폼 공개 베타가 완료됐다고 표현하지 않는다.

## 상태 확인

1. 현재 클라이언트를 식별한다. 셸 승인이 필요하면 먼저 받은 뒤 Codex에서는 `codex plugin list --json`, Claude Code에서는 `claude plugin list --json`을 사용한다.
   - Claude Code CLI와 Claude Desktop 로컬 Code 탭을 구분한다. CLI에는 `/reload-plugins`와 `/mcp`가 있지만 Code 탭은 `+` → `Plugins`와 새 로컬 세션을 사용한다.
2. 정확한 플러그인 ID `ipzitalk-remote`와 `ipzitalk-local`을 찾는다.
3. `Remote`, `OSS`, `설치되지 않음`, `충돌` 중 하나로 판정한다.
4. 두 실행 패키지가 모두 설치 또는 활성화되어 있으면 충돌을 설명하고 중단한다. 어느 쪽도 자동으로 제거하지 않는다.
5. 무관한 플러그인과 사용자가 직접 등록한 MCP 서버는 무시하며 삭제하거나 다시 쓰지 않는다.
6. Codex에서는 `ipzitalk-remote:<skill-name>` 항목만 패키지 Remote Skill 출처로 인정한다. 예상한 접두사 Skill이 없거나 같은 기본 이름의 전역·비플러그인 Skill도 노출되면 `Skill 출처 충돌`로 보고하고 Skill 작업 전에 중단한다. 전역 Skill을 자동으로 삭제하거나 다시 쓰지 않는다.

상태만 요청받았으면 판정 결과를 한국어로 보고하고 아무것도 변경하지 않는다.

## 실행 방식 선택

변경 전에 네이티브 사용자 입력 UI가 있으면 다음 3개 선택지를 한국어로 표시한다. 네이티브 UI가 없으면 같은 항목을 일반 텍스트로 제시하고 답을 기다린다.

- `Remote(호스팅형·권장)` — 공식 OAuth 브라우저 로그인, 호스팅 데이터, 27개 Remote Skill
- `OSS(로컬 실행)` — 사용자 컴퓨터에서 MCP 실행, API 키 4개 필요, Skill 없음
- `상태만 확인` — 설치 상태만 확인하고 변경하지 않음

질문 문구는 `입지톡 실행 방식을 선택해 주세요.`로 쓴다. 기본값을 임의 선택하거나 사용자의 답을 받기 전에 설치하지 않는다.

선택 전에 다음 차이를 설명한다.

- Remote는 호스팅 입지톡 MCP, OAuth, 호스팅 데이터, 27개 Remote Skill을 사용한다.
- OSS는 Node.js로 `presale-mcp`를 로컬 실행하며 사용자 API 키 4개가 필요하다. OSS는 MCP 전용으로 도구 10개를 제공하고 Remote Skill은 포함하지 않는다.
- Codex CLI는 현재 프로세스 환경에 이미 있는 API 키 이름 4개만 `env_vars`로 전달한다. 실제 값을 채팅·명령 인자·manifest·설정 예시에 붙여 넣게 하지 않는다.
- Finder나 Dock에서 실행한 Codex Desktop이 셸 환경변수를 상속한다고 가정할 수 없으므로 안전한 비밀 전달 경로가 검증될 때까지 Desktop OSS를 지원한다고 표현하지 않는다.
- Claude Code는 `required`, `sensitive`로 선언된 `userConfig` 필드에 OSS 값 4개를 저장한다. 사용자가 플러그인 설정 UI에 직접 입력하게 하며 명령 인자가 기록될 수 있는 `claude plugin install --config`로 값을 전달하지 않는다.
- 한 번에 실행 패키지 하나만 지원한다.

사용자가 명시적으로 선택할 때까지 기다린다.

## Remote 설치와 로그인

1. Codex 또는 Claude Code CLI에서는 현재 플랫폼의 정확한 명령과 영향을 한국어로 보여준다: `codex plugin add ipzitalk-remote@ipzitalk --json` 또는 `claude plugin install ipzitalk-remote@ipzitalk --scope user`. Claude Desktop 로컬 Code 탭에서는 슬래시 명령 설치를 주장하지 말고 `+` → `Plugins`의 `ipzitalk-remote` 항목으로 안내한다.
2. 실행 전에 승인을 받는다.
3. 반대 실행 패키지가 있으면 별도 승인을 받아 먼저 제거한다. 제거가 실패하거나 거절되면 Remote를 설치하지 않는다.
4. 승인 후에만 설치 명령을 실행한다.
5. 플랫폼 플러그인 목록을 다시 읽어 Remote만 존재하는지 확인한다. Codex에서는 `codex mcp list --json`도 확인한다.
6. 설치한 같은 실행에서는 로그인 질문을 이어서 하지 않는다. Codex CLI는 새 프로세스, Claude Code CLI는 사용자의 `/reload-plugins`가 필요한 이유를 설명하고 일단 종료한다. 다시 실행된 setup에서 인증 상태를 먼저 확인하고, 미인증일 때만 네이티브 승인 UI로 `브라우저에서 로그인 시작`을 한 번 묻는다.
   - Codex CLI: `codex mcp login ipzitalk`
   - Claude Code CLI: `claude mcp login plugin:ipzitalk-remote:ipzitalk`
   - 현재 명령 실행 컨텍스트가 대화형 터미널(TTY)인지 확인할 수 없으면 모델의 셸 도구나 채팅의 `!` 실행으로 로그인 명령을 대신 실행하지 않는다. 사용자가 Warp·iTerm2·Terminal.app 같은 외부 대화형 터미널에서 정확한 공식 명령을 직접 실행하게 한다.
   - 공식 명령이 시스템 기본 브라우저의 OAuth 페이지를 열도록 맡긴다. 임의 URL을 만들거나 브라우저 주소를 직접 조합하지 않는다.
   - 로그인 명령이 비대화형 터미널 오류를 반환하면 콜백 URL·인가 코드·state를 채팅에 붙여 넣게 하지 않는다. 실패 원인을 한국어로 알리고 외부 대화형 터미널에서 같은 공식 명령을 다시 제안한다.
   - 로그인이 취소되거나 MCP 서버가 아직 로드되지 않았으면 실패 원인을 한국어로 알리고, 새 프로세스·새 세션에서 같은 공식 로그인 동작을 다시 제안한다. 로그인 성공을 추정하지 않는다.
7. Codex Desktop과 Claude Desktop의 로컬 Code 탭에서는 플러그인 변경 후 새 로컬 세션을 열고 `+` → `Plugins`의 연결·로그인 버튼 또는 첫 Remote Skill 호출에서 나타나는 플랫폼 인증 버튼을 누르게 한다. 이전 세션에서 브라우저 자동 실행을 보장하지 않는다.
8. 로그인 후 MCP 상태와 대표 Remote 호출을 확인한다. 인증 URL·코드·토큰을 출력하거나 기록하지 않는다.
9. Codex는 새 프로세스, Claude Code CLI는 `/reload-plugins`, Claude Desktop Code 탭은 새 로컬 세션이 필요하다. 즉시 반영된다고 약속하지 않는다.

## OSS 설치

1. Node.js 18 이상과 `PATH`의 `npx`를 확인한다.
2. Codex CLI에서는 필수 환경변수 이름 4개의 설정 여부만 확인하고 값을 출력하지 않는다. Claude Code에서는 플러그인 설정 UI가 필수 sensitive `userConfig` 값 4개를 안전하게 입력받는다고 설명한다.
3. 실행 명령은 npm registry 게시본 `npx -y presale-mcp@0.1.0`이며, 도구 10개·키 누락 오류 계약과 Claude Code CLI의 사용자 API 키 실제 호출 및 Remote→OSS→Remote 복구까지 검증됐다고 설명한다. 다른 플랫폼까지 검증됐다고 확대하지 않는다.
4. Codex 또는 Claude Code CLI에서는 정확한 명령과 영향을 한국어로 보여준다: `codex plugin add ipzitalk-local@ipzitalk --json` 또는 `claude plugin install ipzitalk-local@ipzitalk --scope user`. Claude Desktop 로컬 Code 탭에서는 `+` → `Plugins`의 `ipzitalk-local` 항목과 설정 UI로 안내한다.
5. 실행 전에 승인을 받는다. Remote가 설치되어 있으면 별도 승인을 받아 먼저 제거하고, 제거가 실패하거나 거절되면 중단한다.
6. 설치 후 플랫폼 플러그인 목록을 확인해 OSS만 존재하는지 검증한다. Codex에서는 `codex mcp list --json`을 확인한다. Claude Code CLI에서는 설치 직후 `/reload-plugins`를 먼저 실행한 다음 `/plugin configure ipzitalk-local@ipzitalk`로 sensitive 필드 4개를 설정하고, 다시 `/reload-plugins`와 `/mcp`를 실행하게 한다. 설치 반영 전 configure 명령이 `not installed in this project`로 실패할 수 있으므로 순서를 바꾸지 않는다. Desktop Code 탭에서는 설정 UI를 사용하고 새 로컬 세션에서 값을 노출하지 않은 채 `presale-mcp`를 확인한다.
7. Codex CLI는 새 프로세스, Claude Code CLI는 다시 불러온 세션, Desktop Code 탭은 새 로컬 세션에서 검증한다. Codex Desktop OSS, Claude Desktop Chat/Cowork, Claude 웹 세션을 지원한다고 표현하지 않는다.

## 전환 또는 제거

Codex에서는 `codex plugin remove <plugin>@ipzitalk --json`, Claude Code에서는 `claude plugin uninstall <plugin>@ipzitalk`을 사용해 정확한 관리 대상만 제거한다.

Remote에서 OSS 또는 OSS에서 Remote로 전환할 때 다음 순서를 지킨다.

1. 정확한 제거 명령을 보여주고 승인받는다.
2. 기존 실행 패키지를 제거한다.
3. 제거가 실패하면 설치 전에 중단한다.
4. 플랫폼 플러그인 목록을 다시 읽어 기존 패키지가 실제로 사라졌는지 확인한다. 제거 명령의 성공 종료 상태만으로는 충분하지 않다. Codex는 이미 없는 플러그인을 제거해도 성공으로 보고할 수 있다.
5. 새 실행 패키지의 정확한 설치 명령을 보여주고 승인받는다.
6. 설치가 실패하면 `설치되지 않음`으로 판정하고, 기존 패키지 재설치를 별도 승인 작업으로 제안한다.

실행 패키지를 제거했다고 OAuth 자격증명이 반드시 삭제된다고 단정하지 않는다. Remote를 다시 설치한 뒤 인증 상태와 대표 호출로 재사용 여부를 확인하며, 이미 인증된 경우 브라우저 로그인을 다시 요구하지 않는다.

`ipzitalk` launcher를 제거해도 실행 패키지를 자동 제거하지 않는다. 완전 제거는 실행 패키지를 먼저, launcher를 나중에 각각 별도 승인받아 제거한다.

Claude Code CLI에서는 각 변경 후 검증 전에 사용자가 `/reload-plugins`를 실행하게 한다. Claude Desktop Code 탭에서는 해당 명령을 안내하지 말고 플러그인 관리 UI와 새 로컬 세션을 사용한다. 슬래시 명령은 사용자 동작이므로 셸에서 대신 실행했다고 표현하지 않는다.

## 보안 경계

- API 키를 요청·반복 출력·기록하거나 명령 인자에 넣지 않는다.
- 환경변수 확인 결과는 필수 이름별 `설정됨` 또는 `누락`으로만 보고한다.
- `~/.codex/config.toml`, Claude 설정·자격증명 파일, marketplace 파일, 플러그인 cache를 직접 편집하지 않는다.
- Claude sensitive `userConfig` 값을 `--config` 인자·셸 기록·로그·문서에 넣지 않는다.
- 알 수 없는 플러그인이나 사용자가 직접 구성한 MCP 서버를 제거하지 않는다.
- Remote와 OSS를 동시에 안전하게 실행할 수 있다고 표현하지 않는다.
