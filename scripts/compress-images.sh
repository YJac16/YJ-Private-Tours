#!/usr/bin/env bash
# Compress public images for web delivery. Requires ffmpeg.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PUB="$ROOT/client/public"

compress_jpeg() {
  local src="$1"
  local dst="$2"
  local max_w="$3"
  local q="$4"
  ffmpeg -y -hide_banner -loglevel error -i "$src" \
    -vf "scale='min($max_w,iw)':-2" \
    -q:v "$q" "$dst"
}

# OG share image — 1200×630 crop, target ~200–400KB
ffmpeg -y -hide_banner -loglevel error -i "$PUB/cape-town-banner.jpg" \
  -vf "scale=1200:630:force_original_aspect_ratio=increase,crop=1200:630" \
  -q:v 4 "$PUB/cape-town-og.jpg"

# Hero banner — max width 1920, lighter than 11MB original
compress_jpeg "$PUB/cape-town-banner.jpg" "$PUB/cape-town-banner.jpg" 1920 5

# Gallery / experience JPEGs over ~500KB
for f in bo-kaap.jpg boulders-beach.jpg cape-point.jpg chapmans-peak.jpg \
  kirstenbosch-botanical-gardens.jpg muizenberg.jpg proteas.jpg winelands.jpg; do
  if [[ -f "$PUB/$f" ]]; then
    compress_jpeg "$PUB/$f" "$PUB/$f" 1400 5
  fi
done

# Large JPG assets used in marketing
for f in blouberg.JPG blouberg-1.JPG bo-kaap-table-mountain.JPG campsbay.JPG \
  campsbay-1.JPG clifton.JPG driver-yaseen.JPG; do
  if [[ -f "$PUB/$f" ]]; then
    compress_jpeg "$PUB/$f" "$PUB/$f" 1400 5
  fi
done

echo "Done. Sizes:"
ls -lh "$PUB/cape-town-og.jpg" "$PUB/cape-town-banner.jpg" 2>/dev/null || true
