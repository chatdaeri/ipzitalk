# ipzitalk-read-notice-compare `window.__DATA__` schema

`notices` 길이가 2 미만이면 본문 섹션 전체가 숨겨진다(hero만 렌더).
섹션 키(`schedule`/`funding`/`limits`/`axes`)는 **null이면 해당 섹션이 통째로 숨겨진다.**
팀색은 인덱스 순서로 자동(A 파랑 · B 빨강 · C 보라 · D 청록) — 데이터에 색을 넣지 않는다.

```js
window.__DATA__ = {
  chips: [],                  // hero 칩, e.g. ["84㎡ 기준", "공고 2건", "모집공고문 기준"]
  notices: [                  // 2~4개, 배열 순서 = 모든 섹션의 값/이벤트 인덱스 기준
    { name: "", noticeDate: "" }   // noticeDate = 공고일 (YYYY-MM-DD)
  ],

  schedule: null | {          // ① 일정 겹침 캘린더
    events: [                 // 날짜 열은 유니크 정렬로 자동 생성
      { notice: 0, label: "특별공급", date: "07/14" }   // notice = notices 인덱스
    ],
    warnings: []              // 겹침 경고 문장, e.g. "7/15 1순위 청약일 겹침 — 중복 신청 가능 여부 공고문 확인 필요"
  },

  funding: null | {           // ② 자금 부담 비교 (전용타입 내 최다 세대수 주택형의 최고 층구간 금액 기준)
    basis: "",                // 섹션 헤더 기준 문구, e.g. "84㎡ 최다세대 주택형 최고 층구간 기준"
    perNotice: [              // notices와 같은 순서
      {
        segments: [           // 스택바 — ratio 합이 100이 되게. 색은 순서대로 계약금/중도금/잔금
          { label: "계약금", ratio: 10, note: "" },
          { label: "중도금", ratio: 60, note: "무이자" },
          { label: "잔금",   ratio: 30, note: "" }
        ],
        initialCash: "0.7억", // 초기 필요 현금(계약금)
        initialCashSub: ""    // 부가 설명
      }
    ],
    initialCashWinner: null,  // 초기 현금 부담 낮은 쪽 인덱스, 판정 유보면 null
    note: ""
  },

  limits: null | {            // ③ 제한사항 비교
    rows: [
      { label: "거주의무", values: ["없음","2년"], winner: 0 }
      // values는 notices 순서. 전부 같으면 자동으로 "(동일)" 표기. winner: null = 우위 표시 안 함
    ],
    quotes: [                 // 공고문 원문 문장 인용 (실제 원문만)
      { notice: 1, label: "거주의무", text: "…" }
    ]
  },

  axes: null | {              // ④ 축별 비교표 (분양가·평당가·공급규모·입주월 등)
    basis: "",                // e.g. "전용 84㎡ 전체 · 세대수 가중평균 · 공급면적 평당가 기준"
    // 🚨 가격 row는 전용타입 전체 세대수 가중평균. 최고가 주택형 1개 대표값 금지. label에 "평균" 명시.
    rows: [
      { label: "84㎡ 평균 분양가(세대수 가중)", values: ["7.10억","7.84억"], winner: null, note: "공고일 6개월 이상 차이 — 우위 미표시" }
    ],
    warnings: []              // e.g. 시점 차이 경고, 공통 타입 하향 안내
  },

  footNote: ""
};
```

- 🚨 **공고일 차이 6개월 이상이면 가격·평당가 row의 `winner`는 반드시 null** + `warnings`에 시점 차이 명시.
- 우위(winner)는 시점 무관 축에만: 일정·초기 현금·거주의무/전매 기간·세대수.
- 결측은 `정보없음` 또는 `공고문 원문 확인 필요` — 0이나 추정값으로 채우지 않는다.
