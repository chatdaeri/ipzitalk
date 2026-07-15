# Remote 0.1.13 문서 추출 보안 보강 검증

- 날짜: 2026-07-15
- Decision: 류호윤 + Codex
- 작업 브랜치: `feat/remote-0.1.8-security-sync`
- SSOT: `ipzitalk-skill` `83f5fd222df2f961208c492d9817748203e01c5a`

## 변경 범위

손상된 legacy HWP에서 `hwp5txt`가 성공 코드와 0바이트 결과를 반환하는 실측 결함을 보강했다. 공통 `document_extract.py`는 외부 추출기가 성공하더라도 결과가 비어 있거나 공백뿐이면 `text output is empty`로 거부하고 최종 출력 파일을 만들지 않는다.

사용자 결과 계약이나 메인 Skill 6개의 버전은 바뀌지 않았다. 패키지 공통 실행 파일이 변경됐으므로 Remote 플러그인만 `0.1.12`에서 `0.1.13`으로 올렸다.

## 체크포인트

- `ipzitalk-skill` `84ef5c2` — 빈 추출 결과 RED
- `ipzitalk-skill` `83f5fd2` — 빈 결과 안전 거부 GREEN
- Remote 패키지 lock: `83f5fd222df2f961208c492d9817748203e01c5a`

## 실제 HWP 검증

- 격리 환경: `/tmp` Python 가상환경
- 설치 패키지: `pyhwp 0.1b15`, 누락 런타임 의존성 `six 1.17.0` 및 `pyhwp`가 설치한 의존성
- 정상 입력: 실제 HWP 5.x 기술문서
- 정상 결과: exit 0, 65줄, 618바이트
- 손상 입력: 같은 HWP를 4,096바이트로 잘라 만든 임시 파일
- 손상 결과: exit 2, `text output is empty`, 최종 출력 파일 0개
- 저장소·시스템 Python 의존성 변경: 없음

## 자동 검증

- `PYTHONPYCACHEPREFIX=/tmp/ipzitalk-pycache python3 -m py_compile scripts/document_extract.py`: 통과
- `node --test tests/*.test.mjs`: 57/57 통과
- `node scripts/validate_namespace_compat.mjs`: MCP 의존 Skill 24개 통과
- `node scripts/sync-skills.mjs --source .../ipzitalk-skill`: Skill 6개·공통 artifact 3개 동기화
- `node scripts/validate-package.mjs`: 통과
- `claude plugin validate --strict .`: 통과
- `claude plugin validate --strict plugins/ipzitalk-remote`: 통과
- SSOT와 플러그인 `document_extract.py`: 차이 0건
- `git diff --check`: 통과

## 남은 gate

- Remote `0.1.13` Claude·Codex 사용자 프로필 설치 완료, 새 세션 문서 추출 회귀는 남음
- `remote-mcp` CSP Report-Only [PR #67](https://github.com/chatdaeri/remote-mcp/pull/67)은 `main` `8c5602b`로 병합되고 운영 Version `067aef55-6449-45cb-a8a3-78e733bed2b8`로 배포 완료
- 운영 `/map` HTTP 200, Report-Only·Referrer·Permissions·nosniff 헤더, 스크립트 nonce 3개 일치, Naver SDK·마커·반경 원 코드 확인 완료
- 현재 Codex 세션은 사용 가능한 브라우저가 0개라 실제 지도 픽셀·콘솔 CSP 위반 확인과 강제 CSP 전환 판단은 남음
- [Remote 오류 #68](https://github.com/chatdaeri/remote-mcp/pull/68)은 `main` `1c5c80e`로 병합 완료
- 리뷰·병합 대기: [Skill #18](https://github.com/chatdaeri/ipzitalk-skill/pull/18), [플러그인 #2](https://github.com/chatdaeri/ipzitalk/pull/2). Remote CSP #67은 #68 병합 뒤 최신 `main` 위로 재배치해 전체 48개 테스트 파일·403개 테스트를 통과한 뒤 병합·배포됐다.

## 사용자 프로필

- Claude: `ipzitalk-remote@ipzitalk` `0.1.13`, user scope, enabled
- Codex: `ipzitalk-remote@ipzitalk` `0.1.13`, enabled
- Local: Claude·Codex 모두 미설치 상태 유지
- Claude·Codex 설치 cache와 저장소 Remote 패키지: 차이 0건
- 새 세션 반영을 위해 Claude·Codex 앱 재시작 필요
