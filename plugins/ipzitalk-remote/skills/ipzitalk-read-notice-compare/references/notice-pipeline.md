# 공고별 추출 파이프라인 (ipzitalk-read-notice-report 복사본)

> ipzitalk-read-notice-report의 Data/tool flow와 ipzitalk-presale-kit `read-screens-pdf-backdata.md` 규칙의 복사본이다.
> 마스터(ipzitalk-read-notice-report)가 갱신되면 이 사본도 재배포한다. 스킬 간 호출이 불가하므로
> ipzitalk-read-notice-compare는 이 문서를 읽어 **공고마다** 아래를 이 실행 안에서 수행한다.

Use **ipzitalk mcp** for live 청약공고/지도/공급정보 lookup.

## 단계 (공고당 1회 — 재추출 금지)

1. **공고 pin** — `house_manage_no` + `announcement_id` 확정. 공고명 매칭이 표기차로 0건이면 좌표+반경 재조회.
2. **공식 모집공고문 PDF/HWP 확보** — ApplyHome 상세의 `모집공고문 보기` 첨부 URL 우선.
   사용자가 로컬 PDF/HWP를 제공·첨부했다면 이를 우선 공식 원문 후보로 읽고 첫 페이지의 공고명·공급위치·공고일·관리번호를 pin과 대조한다. `Remote-only`는 MCP/DB 조회 provenance 제한이지 사용자 제공 원문 열람 금지가 아니다.
   실패 시 공고명 + `입주자모집공고 PDF` 웹검색으로 공식 사업지/ApplyHome static URL 확보.
3. **텍스트 추출** — `pdftotext -layout` 우선, HWPX는 텍스트 추출. 키워드: `재당첨`, `전매`, `거주의무`,
   `분양가상한제`, `계약금`, `중도금`, `잔금`, `입주예정`.
4. **구조화** — 공급대상 / 공급금액 / 일정 / 제한사항 / 납부조건 표 파싱.
   - 공급금액 표는 **주택형 × 층구간 전 행(층별·세대수·공급금액)** 을 빠짐없이 파싱한다. 최고가 행만 뽑지 않는다.
   - 기준 전용타입(기본 84)의 **세대수 가중평균**을 계산한다:
     `평균 분양가 = Σ(세대수 × 층구간 공급금액) ÷ Σ세대수`,
     `평균 평당가 = Σ(세대수 × 층구간 평당가) ÷ Σ세대수` (층구간 평당가 = `공급금액 ÷ (그 주택형 공급면적㎡ ÷ 3.3058)`).
   - 검산: 층별 세대수 합 = 주택형 총세대수, 전용타입 주택형 세대수 합 = 전용타입 총세대수. 불일치면 가격 축 `공고문 원문 확인 필요`.
5. **DB 크로스체크** (백데이터 전용, HTML 노출 금지)
   - 총 공급세대수: PDF 파싱값 = DB 총 공급. PASS / 확인필요(범위·반올림 설명 가능) / FAIL(큰 불일치).
   - 주택형별 세대수: DB `general_supply_units + special_supply_units`와 대조.
   - 최고가·최고 평당가: DB unit max price와 대조. 평당가 = `price_10k / supply_area_sqm * 3.3058`.
     (DB 최고가는 크로스체크용일 뿐 — HTML 가격 축에는 위 4단계의 가중평균을 쓴다.)
   - FAIL이면 중단하거나 해당 값에 `공고문 원문 확인 필요` — 추정값 제시 금지.

## 중단 조건

다음이면 해당 공고의 관련 축을 `공고문 원문 확인 필요`로 두거나 중단한다:

- 공식 PDF/HWP를 확보하지 못함;
- 텍스트 추출 실패 또는 OCR 없는 이미지 전용 PDF;
- 공급/가격/납부 표를 찾지 못함;
- 파싱한 총세대수·최고가가 DB 크로스체크 FAIL;
- 공고문에 없는 납부 비율을 가정해야만 자금 타임라인이 만들어지는 경우.
- 단지명 일부 토큰을 행정 지역으로 추론해야만 fallback할 수 있는 경우. 지역은 PDF 첫 페이지·청약홈 입력·공식 pin 필드에서만 가져오며, `안동 에피트`의 `안동`을 안동시로 해석하는 식의 보정은 금지한다.

## 백데이터 XLSX 시트 (공고별)

원천파일 · 텍스트추출 · 공급대상 · 공급금액 · 가중평균검증 · 일정 · 제한사항 · 납부조건 · DB크로스체크 · 검증결과 · 한계사항

`공급금액` 시트 = 주택형 × 층구간 원본 행 전체(주택형·층별·세대수·공급금액).
`가중평균검증` 시트 = 그 행에 층구간 평당가·세대수×공급금액·세대수×평당가 열을 붙이고, 하단에 합계·평균 행으로 검산 가능하게 남긴다.


## MCP 도구 네임스페이스와 출처

ipzitalk MCP 도구의 네임스페이스는 실행 환경(Codex, Claude Code, Hermes, claude.ai 커넥터 등)에 따라 다르다.
이 문서에 적힌 도구 이름(`search_announcement_info`, `get_geocode`, `get_map_embed_url` 등)은 접두사 없는 **기본 도구명(base tool name)** 이다.

1. 먼저 연결된 도구 목록에서 같은 기본 도구명을 찾는다.
2. 그중 **`ipzitalk-remote` 플러그인의 `ipzitalk` 서버 provenance**가 확인되는 도구만 우선 사용한다. Codex에서는 실제 도구 호출 이벤트의 `server: ipzitalk`과 기본 도구명을 기준으로 확인한다.
3. `presale-mcp` 또는 다른 로컬 MCP provenance의 동명 도구는 Remote Skill의 대체 수단으로 사용하지 않는다.
4. provenance를 확인할 수 없거나 같은 기본 도구명이 여러 서버에 있어 모호하면 임의 선택하지 말고 중단하여 필요한 Remote 도구명을 안내한다.

클라이언트가 연결 도구 목록에 plugin/server provenance를 구조적으로 제공하지 않을 때만 다음 명시적 fallback을 사용한다.

1. `mcp__plugin_ipzitalk-remote_ipzitalk__<도구명>`
2. `mcp__ipzitalk_mcp__<도구명>`
3. `mcp__ipzitalk__<도구명>`
4. `mcp__claude_ai_ipzitalk__<도구명>`

fallback으로도 Remote 출처를 유일하게 확인할 수 없으면 값을 추정하지 말고, 사용자에게 ipzitalk Remote MCP 연결 상태를 확인하도록 안내한 뒤 중단한다.
