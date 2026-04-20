#!/usr/bin/env bash
# Capturas reais para o manual (Chrome headless no Windows via WSL).
# 1) Suba o app: ex. ionic serve ou npm run start -- --host 127.0.0.1 --port 8100 (Node >= 20.19)
# 2) chmod +x docs/manual/capture-screenshots.sh && ./docs/manual/capture-screenshots.sh

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
IMG="$ROOT/docs/manual/images"
CHR="/mnt/c/Program Files/Google/Chrome/Application/chrome.exe"
BASE="${LAWDO_SCREENSHOT_URL:-http://localhost:8100}"

mkdir -p "$IMG"

shot() {
  local winpath name url w h
  name="$1"
  url="$2"
  w="$3"
  h="$4"
  winpath=$(wslpath -w "$IMG/$name")
  "$CHR" --headless=new --disable-gpu "--window-size=${w},${h}" \
    --virtual-time-budget=12000 --screenshot="$winpath" "$url"
  echo "OK $IMG/$name"
}

shot "01-home-desktop.png" "$BASE/home" 1280 900
shot "02-home-mobile.png" "$BASE/home" 390 844
shot "03-rota-sem-sessao-atendimentos.png" "$BASE/atendimentos" 1280 900
