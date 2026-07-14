# ipzitalk-read-notice-report `window.__DATA__` schema

4개 섹션 키(`brief`/`dday`/`funding`/`limits`)는 **null이면 해당 섹션이 통째로 숨겨진다.**
사용자가 요청한 섹션만 채운다.

```js
window.__DATA__ = {
  title: "",                // 공고명 (템플릿이 " 공고 리포트"를 자동으로 붙임)
  desc: "",                  // hero 설명
  chips: [],                 // hero 아래 칩 문자열 배열, e.g. ["084.9794A 기준", "D-12"]
  kpis: [                    // 요약 카드 최대 4개 — 채운 섹션에 맞게 구성
    { label: "", value: "", sub: "" }
    // 전체 리포트: 공급규모/최고 분양가/청약일/전매제한
    // funding만:  선택 주택형/기준 분양가/계약금/납부합계 검증
    // limits만:   재당첨제한/전매제한/거주의무/규제지역
  ],

  brief: null | {
    summary: "",             // 1분 요약 본문 (문장)
    summaryNote: "",         // 요약 아래 작은 안내문
    unitTable: [             // 주택형/가격 요약 표
      // floorAvg   = 주택형별 평균 분양가 — 층별 세대수 가중평균 Σ(층구간 세대수 × 층구간 공급금액) ÷ 주택형 총세대수
      // perPyeong  = 주택형별 평균 평당가 — floorAvg ÷ (공급면적㎡ ÷ 3.3058). 최고가 기준 아님
      { type: "", maxPrice: "", floorAvg: "", perPyeong: "" }
    ]
  },

  dday: null | {
    checklist: [             // 체크리스트 표와 타임라인 스트립 양쪽에 사용
      { label: "", date: "", todo: "" }
    ],
    prepNote: ""             // 준비물/주의사항
  },

  funding: null | {
    basis: "",               // 섹션 헤더 우측 기준 문구, e.g. "084㎡A 최고가 기준"
    schedule: [              // 납부 타임라인
      { label: "", date: "", amount: "" }
    ],
    included: "",            // 포함 항목 문장
    excluded: "",            // 미포함 항목 문장
    basisNote: "",           // 산정 근거 설명 (quote 박스)
    paymentTable: [          // 회차별 납부표
      { label: "", date: "", ratio: "", amount: "", basis: "" }
    ]
  },

  limits: null | {
    restrictions: [
      {
        label: "",           // e.g. "재당첨제한"
        value: "",           // e.g. "10년"
        status: "확인됨|주의|확인 필요",
        cls: "g|a|o",
        quote: ""            // 공고문 원문 문장 인용 (있으면 quote 박스로 표시)
      }
    ],
    questions: []            // 상담 시 바로 확인할 질문 목록
  },

  footNote: ""
};
```

- PDF/HWP 추출이 불완전한 필드는 추정하지 말고 리터럴 `공고문 원문 확인 필요` 를 넣는다.
- funding 금액은 공고문 공급금액/납부조건 표에서만 가져온다.
- limits의 `quote`는 실제 공고문 원문 문장이어야 한다 — 제한 값을 지어내지 않는다.
