# Ipzi Talk (입지톡)

> 부동산 **분양·청약·입지 분석**을 채팅으로 한 줄 말하면 자동으로 해주는 클로드 코드 플러그인이에요.
> “풍무역 반경 3km내 아파트 단지 비교해줘”, "OO시 최근 분양 공고는?", “수원시 영통구에 분양 예정인 아파트 조사해줘”라고 입력하면 공공데이터 및 카카오 지도 데이터를 끌어와 대답해 줍니다.
**[입지톡 공식 URL](https://ipzi-talk.synergylabs.kr)에서 자세한 소개를 보실 수 있어요**

![Author](https://img.shields.io/badge/author-Synergy%20Labs-0b1f3a)
![Skills](https://img.shields.io/badge/skills-3-brightgreen)
![MCP](https://img.shields.io/badge/MCP-Remote%20%2B%20OSS-6b4bff)
![Platform](https://img.shields.io/badge/platform-Claude%20Code%20%C2%B7%20Codex-6b4bff)

---

## 이게 뭔가요? (1분 요약)

- **무엇을 하는 도구:** 글로만 지시해도 부동산 분양·청약·입지 분석을 자동으로 해주는 도구예요.
- **누가 쓰면 좋은가:** 분양대행사·시행사·광고대행사·중개사·내집마련 준비 중인 누구나 — **부동산 데이터 찾기 지겨운 모든 사람.**
- **어떻게 쓰는가:** 클로드 코드(또는 클로드 데스크탑) 안에서 **한국어로 말하듯** 요청하면 됩니다. 개발 지식도, 명령어 암기도 필요 없어요.

**예시 한 줄:**

> "동탄 힐스테이트 아파트 입지 종합 분석해줘."

↓ 2~3분 후 ↓

→ 교통·생활·교육 환경을 종합한 **입지 리포트 + 인근 시설 지도**가 담긴 HTML 파일이
생성됩니다.

---

## 무엇이 들어있나요 — MCP 1개 + 스킬 3종

입지톡은 두 가지가 한 세트로 움직입니다.

- **MCP 서버** — 청약홈 분양공고, K-apt 단지 정보, 카카오/네이버 지도 같은
  **부동산 원천 데이터**를 실시간으로 조회하는 도구입니다.
- **스킬 3종** — 지역 분양공고, 아파트 종합정보, 세부 입지를 HTML 등의 보고서로 만드는 **완성된 자동화 플로우**입니다.

> **추가 설명:**
>
> - **MCP 서버**: AI(Claude/Codex)에 설치하는 '앱 또는 크롬 확장 프로그램'과 비슷합니다. '도구' 또는 '앱' 또는 '커넥터' 라는 이름으로 불리기도 합니다.
> - **스킬(Skill)**: "이런 요청이 오면 이렇게 일해라"를 적어 둔 작업 설명서. AI가 이걸 읽고 전문가처럼 순서대로 처리합니다. 없으면 그냥 일반 AI가 대충 대답할 뿐이에요.

---

## 처음 설치하는 분을 위한 준비

Ipzi Talk 입지톡은 **Claude Code** 안에서 동작합니다. "명령줄에서 쓰는 AI 비서"라고 생각하시면 돼요. 실행 방식은 두 가지 중 하나를 **한 번만** 고르면 됩니다.


| 실행 모드         | 무엇                                                                   | 준비물                  |
| ------------------- | ------------------------------------------------------------------------ | ------------------------- |
| **Remote (권장)** | 입지톡 서버에 접속. 데이터·API 키 걱정 없이 3종 스킬 사용.         | 카카오 회원가입         |
| **OSS (로컬)**    | `presale-mcp`를 내 컴퓨터에서 직접 실행. MCP 도구 10종만, 스킬은 없음. | Node.js 18+, API 키 4개 |

> 빠르게 설치해서 써보고 싶다면, **Remote**를 추천드립니다. 보고서 스킬 3종도 함께 제공해드립니다. OSS는 내 컴퓨터에 직접 설치하는 버전이라 설치가 조금 까다롭습니다.

### Claude Code에서 설치

Claude Code CLI 채팅창에 순서대로 입력하세요:

```
/plugin marketplace add chatdaeri/ipzitalk
```

```
/plugin install ipzitalk@ipzitalk
```

```
/reload-plugins
```

```
/ipzitalk:setup
```
그 다음 2가지 버전 중 하나를 골라 안내에 따라 진행하면됩니다.

**중요** : 설치가 끝나면 클로드를 한번 완전 종료 후 켜주세요.

> * 클로드 데스크탑 또는 ChatGPT를 사용하는 경우, 다음 링크에 따라 설치해주세요:
> * [클로드 데스크탑 or ChatGPT / Codex 연결방법](https://ipzi-talk.synergylabs.kr#Quickstart)

---

## 쓰는 법 — 채팅창에 말만 걸면 끝

설치·선택이 끝나면, 그냥 **한국어로 원하는 걸 설명**하세요.

AI가 입지톡 MCP로 데이터를 조회해 바로 대답해줍니다:

입지톡 Remote MCP의 공개 도구 10개:


| 도구                        | 기능                                                         | 예시 프롬프트                      |
| ----------------------------- | -------------------------------------------------------------- | ------------------------------------ |
| `get_geocode`               | 도로명/지번 주소 → 위도·경도 좌표 (카카오 법정동코드 보강) | "서초구 방배동 424-28 좌표 찾아줘" |
| `get_address`               | 단지명·장소명 → 카카오 주소 후보(좌표 포함)                | "반포자이 주소 어디야?"            |
| `get_region_code`           | 주소·지역명 → 법정동코드·시군구코드·청약홈 지역코드      | "구리시 지역코드 알려줘"           |
| `search_by_nearby_category` | 좌표 주변 카테고리 시설(학교·지하철·마트 등) 검색          | "이 좌표 주변 지하철역 찾아줘"     |
| `search_by_nearby_keyword`  | 좌표 주변 키워드 검색(아파트·오피스텔·도서관 등)           | "이 주변 아파트 단지 검색해줘"     |
| `find_complexes_near_point` | 좌표 주변 K-apt 단지를 거리순으로 조회                      | "이 좌표 주변 아파트 찾아줘"       |
| `get_complex_info_by_query` | 단지명·주소로 K-apt 단지 기본·상세정보 조회                 | "반포자이 단지 정보 알려줘"        |
| `get_complex_info_batch`    | 여러 K-apt 단지 기본·상세정보 일괄 조회                     | "이 단지들을 한 번에 비교해줘"     |
| `search_presale_notices_by_filter` | 지역·기간·공고명으로 청약홈 모집공고 조회           | "의왕시 최근 6개월 공고 찾아줘"    |
| `get_map_embed_url`         | 마커·반경을 담은 공유용 인터랙티브 지도 URL 생성            | "이 단지들 지도 링크 만들어줘"     |

## 스킬 3종 카탈로그

Remote 버전은 보고서 생성 요청에 사용하는 핵심 스킬 3종을 제공합니다.

> 자동 실행은 사용자가 `보고서`·`리포트`·`HTML` 생성을 명시적으로 요청한 경우에만 허용됩니다.
> Claude Code에서는 `/스킬이름`, Codex에서는 `$스킬이름`으로 직접 지정할 수도 있습니다.

### 1. 세부 입지 보고서 — `ipzitalk-location-report`

<img src="./assets/screenshots/location-report.gif" alt="세부 입지 보고서 예시" width="900">

- **입력:** 주소 또는 아파트명
- **내용:** 교통·생활·교육 환경, 거리 근거, 종합 지도
- **결과물:** HTML / PPTX / DOCX 중 사용자가 선택한 1개

### 2. 이 아파트 한눈에 보기 — `ipzitalk-complex-overview-all`

<img src="./assets/screenshots/complex-overview-all.gif" alt="이 아파트 한눈에 보기 예시" width="900">

- **입력:** 아파트명 또는 소재 주소
- **내용:** K-apt 기본정보, 교통·생활·교육, 인근 아파트 5곳, 지역 최근 분양공고, 지도
- **제외:** 실거래가, 매매·전세 시세, 평당가, 분양가
- **결과물:** HTML

### 3. 지역 분양공고 — `ipzitalk-presale-notices`

- **입력:** 지역명 또는 주소와 조회 기간(기본 최근 6개월)
- **내용:** 공고명, 주택구분, 공급위치, 공고일, 총공급세대, 입주월, 공식 공고 링크
- **제외:** 분양가 및 가격 비교
- **결과물:** HTML

---

## 자주 묻는 질문

**Q. 코딩 한 번도 안 해봤는데 괜찮나요?**
A. 네, **전혀 필요 없어요.** Claude Code 또는 Codex만 설치하면 전부 한국어 대화로 끝납니다.

**Q. Remote랑 OSS 중 뭘 골라야 하나요?**
A. 보고서 스킬 3종을 쓰고 싶으면 **Remote**. 데이터를 내 컴퓨터에서 직접 통제하고 싶은
개발자라면 **OSS**(MCP 도구 10종, 스킬 없음). 둘을 동시에 켜지는 마세요.

**Q. OSS를 쓰려면 무슨 키가 필요한가요?**
A. 카카오 REST API 키, 네이버 지도 Client ID/Secret, data.go.kr 서비스 키 —
총 4개입니다. 이 값들은 **절대 채팅·명령어·설정 파일에 붙여넣지 마세요.**
Claude Code는 보안 저장소(userConfig)로, Codex는 프로세스 환경변수로만 전달합니다.

**Q. 결과물을 편집·공유할 수 있나요?**
A. 네, 표준 **HTML 파일**이에요. 브라우저로 열어 확인하고, 그대로 고객·팀에 공유하거나
PDF로 저장하면 됩니다.

**Q. 데이터는 안전한가요?**
A. OSS 모드는 조회가 **여러분 컴퓨터에서** 이뤄집니다. Remote 모드는 챗대리 호스팅 서버를
OAuth로 이용합니다. (단, AI 응답을 받기 위해 대화 내용은 Anthropic 서버로 전달됩니다.
회사 보안 정책에 따라 판단해 주세요.)

---

## 이 플러그인은 어떻게 구성되어 있나요?

```
ipzitalk/
├── .claude-plugin/            ← 마켓플레이스 명함 (3개 플러그인 등록)
├── plugins/
│   ├── ipzitalk/              ← ★ 런처: Remote/OSS를 고르는 setup 스킬
│   ├── ipzitalk-remote/       ← ★ 호스팅 MCP + 스킬 3종
│   └── ipzitalk-local/        ← OSS presale-mcp (MCP 도구 10종, 스킬 없음)
├── docs/                      ← 플랫폼별 설치·전환·제거 가이드
├── scripts/                   ← 패키지 검증 스크립트
└── source-lock.json           ← 스킬·MCP 소스 버전 고정
```

**핵심 세 가지:**

- **`ipzitalk` (런처)** — 설치하면 가장 먼저 실행하는 `setup` 스킬. Remote와 OSS 중
  하나를 고르게 하고, 상태를 점검하고, 전환·제거까지 안내합니다.
- **`ipzitalk-remote`** — 호스팅 MCP(`https://ipzi-talk.synergylabs.kr/mcp`)와
  스킬 3종이 담긴 본체. 대부분의 사용자가 실제로 쓰는 부분이에요.
- **`ipzitalk-local`** — 오픈소스 `presale-mcp`를 내 컴퓨터에서 실행하는 MCP-only 모드.

세 플러그인이 한 마켓플레이스로 묶여 있고, 런처가 그중 하나만 활성화하도록 관리합니다.

---

## 문의

- **버그 리포트·스킬 제안:** GitHub 이슈 환영합니다
- **도입·제휴 문의:** [synergylabs.kr](https://synergylabs.kr)

---

## 라이선스

### 오픈소스 구성요소

이 저장소에 포함된 다음 구성요소는 [MIT License](./LICENSE)에 따라 제공됩니다.

- `plugins/ipzitalk`
- `plugins/ipzitalk-local`
- `plugins/ipzitalk-remote`에 포함된 Skill 및 클라이언트 설정
- 저장소에 포함된 설치 스크립트와 문서

### 입지톡 Remote 서비스

입지톡 Remote MCP 서버의 백엔드 소스 코드, 데이터 인프라 및 호스팅 서비스는 이 저장소에
포함되지 않으며 MIT License의 적용 대상이 아닙니다.

입지톡 Remote MCP 서비스의 이용 권한, 사용 제한, 계정, 요금, 데이터 및 서비스 운영에 관한
사항은 입지톡 서비스 이용약관을 따릅니다.

Copyright © 2026 Synergy Labs. All rights reserved for the hosted service and
server-side components not included in this repository.
