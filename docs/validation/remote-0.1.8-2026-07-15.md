# Remote 0.1.8 내부 검증

검증일: 2026-07-15

## 범위와 상태

Remote `0.1.8`은 `ipzitalk-skill`의 로컬 `fix/html-template-security` 브랜치 커밋 `8b2f70e61b1925382887c8173a4b8a1edc0e9fae`를 잠근 내부 검증 패키지다. 해당 Skill 변경은 아직 원격 push·PR·병합 전이므로 이 lock을 공개 배포 기준으로 사용하지 않는다. Local payload는 설치하거나 변경하지 않았다.

패키지는 메인 Skill 6개와 공통 artifact 3개를 포함한다.

- `ipzitalk-complex-overview-all` `1.1.0`
- `ipzitalk-location-report` `1.3.1`
- `ipzitalk-presale-report` `1.1.0`
- `ipzitalk-read-notice-compare` `1.2.1`
- `ipzitalk-read-notice-report` `1.2.1`
- `ipzitalk-recent-market-trend` `1.2.1`
- `scripts/document_extract.py`
- `scripts/html_artifact_contract.mjs`
- `scripts/xlsx_artifact.py`

## 패키지 검증

- `node scripts/validate-package.mjs`: 통과
- `claude plugin validate --strict .`: 통과
- launcher·Remote·Local 개별 strict validation: 통과
- `ipzitalk-skill` namespace validator: MCP 의존 Skill 24개 통과
- `node --test tests/*.test.mjs`: 42/42 통과
- Skill 6개와 artifact 3개의 source/target `diff -qr`: 차이 0건
- Codex·Claude 설치 cache와 저장소 `plugins/ipzitalk-remote`: 차이 0건
- `git diff --check`: 통과

번들 Python validator는 실행 환경에 PyYAML이 없어 `ModuleNotFoundError: No module named 'yaml'`로 시작하지 못했다. 검증만을 위한 새 의존성은 설치하지 않았다.

## 설치와 새 세션 발견

Codex와 Claude Code 사용자 프로필에서 launcher `0.1.1`은 유지하고 Remote만 `0.1.8`로 갱신했다. 두 프로필 모두 Remote가 installed·enabled 상태이고 Local은 미설치다. Telegram·Warp 등 무관 플러그인은 변경하지 않았다.

Codex `debug prompt-input`과 새 Claude print session에서 다음 plugin-prefixed Skill 6개가 모두 노출됐다.

- `ipzitalk-remote:ipzitalk-complex-overview-all`
- `ipzitalk-remote:ipzitalk-location-report`
- `ipzitalk-remote:ipzitalk-presale-report`
- `ipzitalk-remote:ipzitalk-read-notice-compare`
- `ipzitalk-remote:ipzitalk-read-notice-report`
- `ipzitalk-remote:ipzitalk-recent-market-trend`

## Remote MCP canary

새 Codex 세션과 새 Claude Code 세션에서 각각 Remote `get_geocode`를 정확히 1회 호출했다. 두 세션 모두 `서울특별시 중구 세종대로 110`을 위도 `37.5666103`, 경도 `126.9783882`로 반환했고 추가 인증 요청은 없었다.

- Codex: `mcp__ipzitalk__get_geocode`
- Claude Code: `mcp__plugin_ipzitalk-remote_ipzitalk__get_geocode`

Codex의 선행 실패 케이스 `서울특별시청`은 동일 Remote 도구까지 정상 도달한 뒤 `ADDRESS_NOT_FOUND`를 반환했다. 정식 도로명주소 성공과 함께 보면 플러그인 연결 실패가 아니라 입력 문자열 해소 차이다.

## Location Report E2E

새 Codex 세션에서 `ipzitalk-location-report`로 방배롯데캐슬아르떼 HTML 리포트를 생성했다.

- Skill base directory: Codex Remote `0.1.8` cache
- Remote MCP 호출: 정확히 17회
- 호출 구성: `get_address` 1회, `search_by_nearby_category` 6회, `search_by_nearby_keyword` 9회, `get_map_embed_url` 1회
- `calls` sequence: 1~17 연속
- 감사 복원용 재호출: 0회
- `auditIncomplete`: `false`
- web 도구: 0회
- HTML 공통 validator: prefix/suffix 동일, 금지 콘텐츠 0건
- 독립 재렌더 결과와 산출 HTML: byte-identical
- 비실행 `ipzi-data` JSON 경계, iframe `sandbox`와 `referrerpolicy`: 확인

발급된 지도 URL은 HTTP 200을 반환했고, SITE 포함 실제 장소 마커 12개, 반경 1,500m, 네이버 지도 SDK와 반경 원 렌더 코드가 포함됐다. 인앱 브라우저에는 사용 가능한 browser binding이 없었고 진단 문서도 설치 캐시의 버전 경로 불일치로 열리지 않아 실제 픽셀 렌더와 CSP 조합은 확인하지 못했다.

임시 검증 산출물:

- `/private/tmp/ipzitalk-018-e2e/location-report/out/ipzitalk-location-report/result.html`
- `/private/tmp/ipzitalk-018-e2e/location-report/out/ipzitalk-location-report/result.json`
- `/private/tmp/ipzitalk-018-e2e/location-report/out/ipzitalk-location-report/audit.json`

## Recent Market Trend E2E

새 Codex 세션에서 서초구·강남구의 2026년 5월과 4월 매매 시장을 비교했다.

- 지역 수 `N=2`, 지역명 해소 수 `R=2`
- 정상 호출식 `2N + R = 6`
- 실제 Remote MCP 호출: 6회
- `get_region_code`: 2회
- `get_complex_trades`: 4회, 모두 `trade_type=sale`, `limit=1`
- `calls` 행: 6개, 필수 필드 누락 0건
- 감사 복원용 재호출: 0회
- `auditIncomplete`: `false`
- HTML 공통 validator: prefix/suffix 동일, 금지 콘텐츠 0건

임시 검증 산출물:

- `/private/tmp/ipzitalk-018-e2e/recent-market-trend/result.html`
- `/private/tmp/ipzitalk-018-e2e/recent-market-trend/result.json`
- `/private/tmp/ipzitalk-018-e2e/recent-market-trend/audit.json`

## 판정

Remote `0.1.8`의 패키지 동기화, 두 플랫폼 설치, 새 세션 Skill 6개 발견, Remote MCP 성공 호출, 안전한 HTML 데이터 경계, Location Report 호출 원장, Recent Market Trend 호출별 원장은 통과했다. 실제 브라우저 지도 픽셀 렌더·CSP 조합, 악성 PDF/HWP/HWPX 회귀, Skill 보안 브랜치의 원격 PR·병합과 병합 SHA 재잠금은 남아 있으므로 공개 베타 완료로 판정하지 않는다.
