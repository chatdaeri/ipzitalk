# 공식 모집공고문 자동 확보 계약

공고는 사용자 첨부 파일이 없어도 공고명 또는 `house_manage_no`+`announcement_id`로 공식 원문을 확보한다.

1. 사용자 첨부 PDF/HWP/HWPX가 이미 있으면 공식 원문 후보로 사용한다.
2. Remote 검색 결과로 공고를 pin하고 `house_manage_no`와 `announcement_id`를 확정한다. MCP의 `detail_url`·`official_url`은 확인하거나 사용하지 않는다.
3. pin 직후 두 식별자로 다음 주소를 항상 조립한다.
   `https://www.applyhome.co.kr/ai/aia/selectAPTLttotPblancDetail.do?houseManageNo=<house_manage_no>&pblancNo=<announcement_id>`
4. ApplyHome 상세 페이지의 `getAtchmnfl.do` 링크를 HTTP로 수집한다. LH 연결 공고는 공식 LH 첨부 목록을 해소한다.
5. HTTP 해소가 실패할 때만 브라우저 제어로 같은 공식 페이지의 첨부 링크를 확인한다.
6. 공식 경로가 모두 실패한 공고만 사용자에게 파일 첨부를 요청한다. DB 값으로 원문을 대신하지 않는다.

정정 공고문을 우선하되 정정 범위가 일부이면 최초 공고문과 문서군으로 묶는다. 공급안내문·체크리스트·위임장·동의서·팸플릿·평면도는 제외한다. 최초 URL과 redirect는 ApplyHome/LH HTTPS allowlist로 제한하고, 50 MiB 상한·Content-Type·파일 signature·hash 중복 방지를 적용한다.

공고명·관리번호·공고번호·공급위치·모집공고일을 원문과 대조하고, 충돌하면 값을 섞지 않는다. 원문 해소 결과는 `audit.json.noticeResolutions[]`에 남긴다.
