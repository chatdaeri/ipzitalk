"""result.json 의 동적 지도를 PNG로 캡처한다. build_pptx.py · build_docx.py 공용.

설치된 Chrome을 헤드리스로 띄워 map.url 페이지를 찍는다. 반경 원·마커 라벨이 그대로 들어온다.
Chrome이 없거나 캡처가 실패하면 지도 없이 렌더하고 경고만 남긴다 — 리포트를 멈추지 않는다.
"""
import os
import shutil
import subprocess
import sys
import tempfile
from urllib.parse import parse_qsl, urlsplit, urlunsplit

CHROME_CANDIDATES = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "google-chrome",
    "chromium",
    "chromium-browser",
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
]

# 지도 페이지 왼쪽의 마커 목록 패널 폭(px). 산출물에는 지도만 넣는다.
SIDEBAR_PX = 280
MAP_ORIGIN_HOST = "ipzi-talk.synergylabs.kr"


def validate_map_url(value):
    """정식 Ipzi Talk HTTPS 지도 URL만 Chrome에 전달한다."""
    if not isinstance(value, str) or not value:
        return None
    try:
        parsed = urlsplit(value)
        if parsed.scheme != "https" or parsed.hostname != MAP_ORIGIN_HOST:
            return None
        if parsed.port is not None or parsed.username or parsed.password:
            return None
        if parsed.path != "/map" or parsed.fragment:
            return None
        query = parse_qsl(parsed.query, keep_blank_values=True, strict_parsing=True)
        if len(query) != 1 or query[0][0] != "d" or not query[0][1]:
            return None
        return urlunsplit(parsed)
    except (TypeError, ValueError):
        return None


def _find_chrome():
    for c in CHROME_CANDIDATES:
        if os.path.exists(c):
            return c
        found = shutil.which(c)
        if found:
            return found
    return None


def _capture(url, out_path, width=1180, height=760):
    url = validate_map_url(url)
    if not url:
        print("[warn] 허용되지 않은 지도 URL — 지도 없이 렌더합니다.", file=sys.stderr)
        return None
    chrome = _find_chrome()
    if not chrome:
        print("[warn] Chrome을 찾지 못했습니다 — 지도 없이 렌더합니다.", file=sys.stderr)
        return None
    try:
        subprocess.run(
            [chrome, "--headless", "--disable-gpu", "--hide-scrollbars",
             f"--screenshot={out_path}", f"--window-size={width},{height}",
             "--virtual-time-budget=8000", url],  # 지도 타일·마커가 다 그려질 때까지 기다린다
            check=True, capture_output=True, timeout=60,
        )
    except Exception as e:
        print(f"[warn] 동적 지도 캡처 실패({e}) — 지도 없이 렌더합니다.", file=sys.stderr)
        return None
    if not os.path.exists(out_path):
        return None
    try:  # 왼쪽 마커 목록 패널을 잘라내고 지도만 남긴다 (Pillow 없으면 그대로 쓴다)
        from PIL import Image

        im = Image.open(out_path)
        im.crop((SIDEBAR_PX, 0, im.width, im.height)).save(out_path)
    except Exception:
        pass
    return out_path


def resolve_map_image(data, explicit=None, prefix="ipzitalk-map"):
    if explicit and os.path.exists(explicit):
        return explicit
    url = (data.get("map") or {}).get("url")
    if not url:
        return None
    return _capture(url, os.path.join(tempfile.gettempdir(), f"{prefix}.png"))
