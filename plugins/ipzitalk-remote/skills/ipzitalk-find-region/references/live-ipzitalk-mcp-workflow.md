# Live ipzitalk mcp A1 workflow notes

Use this reference when building an A1 regional/pinpoint-area screen from live MCP output rather than only from local REF_DB scripts.

## Durable lessons from the Poil-dong run

- User-facing wording should say `ipzitalk mcp`; avoid the old product/server label in reports, skills, and user-visible HTML.
- If the current Hermes session still exposes stale tool namespaces after an MCP rename, verify the configured server with `hermes mcp list` / `hermes mcp test ipzitalk-mcp`. A running Telegram session may keep old tool schemas until restart, so for deterministic builds you can call the MCP endpoint through the SDK using the cached OAuth token for `ipzitalk-mcp`.
- For pinpoint regions such as `의왕시 포일동 인근`, geocode the place first, then call `search_announcement_info` by `center_lat`, `center_lng`, and `radius_km` instead of only `sigungu`/`umd`. This captures nearby cross-boundary 공고 such as 과천/안양/군포 within the user’s requested radius.
- Do not trust `search_announcement_info.unlocated_presales` as final. Try precise address extraction + `get_geocode`, then `get_address`; only remaining failures belong in `위치 확인 필요`.
- Include all located records as markers in `get_map_embed_url` — the map is an iframe with no marker cap, so there is no need to trim to a top-N subset the way a static image would.
- HTML must remain product/user language only: `Ipzi Talk`, `자료 기준`, `지도 기준`, `주소 보완좌표`, `지도 크게 열기`. Do not expose implementation tool names in the final HTML.

## Minimal live-call sequence

1. `get_geocode({ address: '<시군구 동/지번>' })` to obtain center.
2. `search_announcement_info({ center_lat, center_lng, radius_km, include_units: true, limit: 100, offset: 0, unlocated_limit: 50 })`.
3. For every unlocated row:
   - extract precise jibun/road address;
   - call `get_geocode({ address })`;
   - if no reliable coordinate, call `get_address({ query: row.name or address })`.
4. Build markers for all located records and call `get_map_embed_url`; put the result in `ipzi-data.mapUrl`.
5. Fill `ipzi-data.listings[].units[]` per announcement/complex — the template renders `rowspan` automatically, do not hand-write table HTML.
6. Verify: HTML exists, `ipzi-data.mapUrl` is set (or `null` when nothing to map), `rowspan` appears in rendered output, no forbidden strings, no leftover sample data.
