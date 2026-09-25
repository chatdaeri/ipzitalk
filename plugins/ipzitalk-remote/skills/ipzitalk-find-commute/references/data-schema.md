# ipzitalk-find-commute `ipzi-data` 비실행 JSON 블록 schema

Same shape as ipzitalk-find-region/ipzitalk-find-nearby (see `ipzitalk-find-region/references/data-schema.md`):

```js
{
  title: "",             // e.g. "회사 근처 청약공고"
  desc: "",
  chips: [],
  kpis: [ { label: "", value: "", sub: "" } ],
  mapUrl: null,            // get_map_embed_url result
  mapTitle: "", mapDesc: "", mapHint: "",
  unlocated: [ { name: "", reason: "" } ],
  cardsTitle: "거리순 후보",
  listings: [
    {
      name: "", locationLabel: "", maxPriceLabel: "", supplyCount: "",
      dateStr: "", addressDetail: "", distanceLabel: "", detailUrl: "",
      units: [ { type: "", maxPrice: "", supply: "" } ]
    }
  ],
  tableTitle: "",
  priceNote: "",          // e.g. "표시된 금액은 주택형별 최고가 기준입니다. 평균가·최저가와 다를 수 있습니다."
  footNote: "",
  sourceNote: ""          // e.g. "데이터 출처: 청약홈 분양정보 · 청약홈 주택형별 분양정보" — see ipzitalk-presale-kit/references/db-source-labels.md
};
```

`priceNote` is always required when `units[].maxPrice` is shown — REF_DB's `max_price_10k` is the highest-price unit within that house type, not an average.
