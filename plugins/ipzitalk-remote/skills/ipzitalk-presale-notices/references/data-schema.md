# `ipzitalk-presale-notices` 결과 데이터

`templates/result.html`의 비실행 `ipzi-data` 블록에 다음 형태를 넣는다.

```jsonc
{
  "title": "",
  "desc": "",
  "scope": {
    "regionName": "",
    "applyhomeCode": "",
    "applyAddress": "",
    "dateFrom": "",
    "dateTo": ""
  },
  "summary": {
    "noticeCount": 0,
    "confirmedSupplyTotal": 0,
    "missingSupplyCount": 0
  },
  "notices": [
    {
      "houseManageNo": "",
      "pblancNo": "",
      "name": "",
      "houseTypeName": "",
      "address": "",
      "announcementDate": "",
      "moveInMonth": "",
      "totalSupply": null,
      "detailUrl": ""
    }
  ],
  "pagination": {
    "pagesFetched": 0,
    "totalCount": 0,
    "complete": true
  },
  "notes": [],
  "sourceNote": "데이터 출처: 청약홈 APT 모집공고"
}
```

- 분양가·평당가·가격 비교·좌표·거리·주택형별 공급 필드를 추가하지 않는다.
- `confirmedSupplyTotal`은 `totalSupply`가 숫자인 공고만 합산하고 `missingSupplyCount`를 함께 표시한다.
- `pagination.complete`는 모든 `next_page`를 성공적으로 수집했을 때만 `true`다.
- 원문 링크는 서버가 반환한 HTTPS URL만 사용한다.
