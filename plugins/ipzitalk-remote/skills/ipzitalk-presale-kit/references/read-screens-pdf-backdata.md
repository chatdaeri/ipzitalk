# ipzitalk-read-notice-report official announcement backdata pattern

This reference captures the durable workflow learned from building Ipzi Talk ipzitalk-read-notice-report brief/limits/funding sections (originally the separate read-brief/read-limits/read-funding screens, consolidated 2026-07-09).

## User correction that matters

The user explicitly corrected the workflow:

- `1-minute briefing`, `restriction summary`, and `funding timeline` must be built from the official 모집공고문 PDF/HWP, not only from 청약홈 DB/detail data.
- A backdata XLSX is required.
- Validation contents must be included in the XLSX.
- Because PDF table parsing can be uncertain, parsed values must be cross-checked against DB values.
- DB cross-check / evidence-comparison wording must **not** appear in the user-facing HTML.

## Backdata XLSX minimum sheets

Use these sheets for ipzitalk-read-notice-report when applicable:

| Sheet | Purpose |
|---|---|
| 원천파일 | Official URL, downloaded file path, file size, extraction method |
| 텍스트추출 | Extractor used, text length, OCR/PDF limitations |
| 공급대상 | Housing type, exclusive/supply area, parsed units, DB units |
| 공급금액 | Housing type, floor band, price, included/excluded options |
| 일정 | Application, winner, document, contract, move-in dates |
| 제한사항 | Transfer restriction, residence duty, re-winning restriction, duplicate application, etc. |
| 납부조건 | Contract payment, interim payments, balance, fund/loan items |
| DB크로스체크 | Parsed total/unit counts, highest prices, highest pyeong prices vs DB |
| 검증결과 | PASS / 확인필요 / FAIL with action notes |
| 한계사항 | OCR/table parsing limitations and values requiring human review |

## Cross-check rules

- Total units:
  - PASS: PDF parsed total equals DB total supply.
  - 확인필요: small differences explainable by scope, rounding, or excluded categories.
  - FAIL: large mismatch, missing housing type, or likely table parsing error.
- Housing-type units:
  - Compare parsed units with DB `general_supply_units + special_supply_units`.
- Highest price / highest pyeong price:
  - Compare parsed highest price with DB unit max price.
  - Pyeong price formula: `price_10k / supply_area_sqm * 3.3058`.
  - PASS: difference within rounding tolerance.

## HTML hiding rule

ipzitalk-read-notice-report HTML should show clean consumer-facing content only:

- brief section: one-minute briefing with source language like `공식 모집공고문 PDF 기준`.
- limits section: restriction cards and consultation questions.
- funding section: funding timeline and payment table.

Do not show these visible phrases in HTML:

- `DB크로스체크`
- `DB 크로스체크`
- `근거대조`
- `근거 대조`

Keep those details in XLSX/backdata.

## Stop conditions

Stop or mark `공고문 원문 확인 필요` if:

- official PDF/HWP cannot be obtained;
- text extraction fails or appears image-only without OCR;
- supply/price/payment tables cannot be located;
- parsed total units or max prices fail DB cross-check;
- the funding timeline would require assumed payment ratios not present in the announcement.
