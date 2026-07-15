# ipzitalk-find-region `ipzi-data` 비실행 JSON 블록 schema

```js
{
  title: "",             // e.g. "김포시 청약공고"
  desc: "",               // one-line hero description
  chips: [],               // string[], e.g. ["청약홈 DB 기준","희망지역"]
  kpis: [                 // 4 KPI boxes
    { label: "", value: "", sub: "" }
  ],
  mapUrl: null,            // get_map_embed_url result, or null to hide the map panel
  mapTitle: "지도",
  mapDesc: "",
  mapHint: "",
  unlocated: [             // records that failed both geocode + get_address fallback
    { name: "", reason: "" }
  ],
  cardsTitle: "거리순 후보",
  listings: [
    {
      name: "",            // 단지/공고명
      locationLabel: "",   // "시군구 동 · 0.9km" style short label
      maxPriceLabel: "",   // "10.79억"
      supplyCount: "",     // "586"
      dateStr: "",         // 공고일 YYYY-MM-DD
      addressDetail: "",   // full road/jibun address
      distanceLabel: "",   // "0.9km" (shown under location in the table)
      detailUrl: "",       // ApplyHome detail URL, or omit to show "공고문 원문 확인 필요"
      units: [
        { type: "", maxPrice: "", supply: "" }
      ]
    }
  ],
  tableTitle: "주택형 비교표",
  priceNote: "",          // e.g. "표시된 금액은 주택형별 최고가 기준입니다. 평균가·최저가와 다를 수 있습니다."
  footNote: "",
  sourceNote: ""          // e.g. "데이터 출처: 청약홈 분양정보 · 청약홈 주택형별 분양정보" — see ipzitalk-presale-kit/references/db-source-labels.md
};
```

Notes:
- The template renders `rowspan` from `listings[].units.length` — never write table HTML by hand.
- `unlocated` panel is hidden automatically when the array is empty.
- `mapUrl: null` hides the entire map section.
- `sourceNote` must use only user-facing labels (청약홈 분양정보/청약홈 주택형별 분양정보/주소 보완좌표) — never internal REF_DB table names.
- `priceNote` is always required when `units[].maxPrice` is shown — `max_price_10k` from REF_DB is the highest-price unit within that house type, not an average, so the table must say so explicitly.
