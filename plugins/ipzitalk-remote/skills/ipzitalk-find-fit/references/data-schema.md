# ipzitalk-find-fit `ipzi-data` 비실행 JSON 블록 스키마

```jsonc
{
  "title": "",              // e.g. "나에게 맞는 청약공고 찾기"
  "desc": "",
  "chips": [],                // e.g. ["청약홈 DB 기준","추정 계산"]
  "kpis": [ { "label": "", "value": "", "sub": "" } ],   // 4 boxes: 추정 가능 주택가격 / 월상환 가능액 / 가능 후보 / 초과 후보
  "conditions": [],            // string[] rendered as the numbered input-flow chips
  "listings": [
    {
      "name": "",              // 단지/공고명
      "locationLabel": "",     // "시군구 동"
      "addressDetail": "",     // full address
      "dateStr": "",           // 공고일
      "detailUrl": "",         // ApplyHome detail URL
      "units": [
        { "type": "", "maxPrice": "", "supply": "", "cls": "g|a|o", "diff": "" }
        // cls: g=가능, a=아슬아슬, o=초과
        // diff = 추정 가능 주택가격 − 분양가 (부호 필수)
        //   예산이 남으면 양수 "+66,639만원"  /  예산을 넘으면 음수 "-34,198만원"
      ]
    }
  ],
  "priceNote": "",           // e.g. "표시된 금액과 예산 차이는 주택형별 최고가 기준입니다. 평균가·최저가와 다를 수 있습니다."
  "footNote": "",
  "sourceNote": ""          // e.g. "데이터 출처: 청약홈 분양정보 · 청약홈 주택형별 분양정보" — see ipzitalk-presale-kit/references/db-source-labels.md
}
```

Notes:
- The three status columns (가능/아슬아슬/초과) are computed automatically by grouping `listings[].units[]` by `cls` — don't build them separately.
- This screen has no map section.
- `cls`/`diff` on each unit are locally computed from the user's affordability inputs, not REF_DB fields — they don't need a DB cross-check, just correct recomputation.
- `diff`의 부호는 상수가 아니다. `추정 가능 주택가격 − 분양가`를 그대로 쓰므로 `cls: "g"`(가능)이면 대개 `+`, `cls: "o"`(초과)이면 `-`가 된다. 모든 unit에 `-`를 붙이면 "가능" 후보가 예산 부족처럼 읽히는 오류가 난다.
- `priceNote` is always required — `maxPrice` (and the `diff`/affordability calc built from it) is a max-price basis, not an average, so both the price and the budget gap must carry the caveat.
