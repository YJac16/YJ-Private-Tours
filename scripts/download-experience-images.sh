#!/usr/bin/env bash
# Curated experience route images (Pexels + on-brand local copies). Re-run after adding assets.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PUB="$ROOT/client/public/experiences"
SRC="$ROOT/client/public"
mkdir -p "$PUB"

download() {
  curl -fsSL "$1" -o "$PUB/$2"
}

# Pexels (free licence) — landscape / place matched; winelands avoid tasting-room stock
download "https://images.pexels.com/photos/35221353/pexels-photo-35221353.jpeg?auto=compress&cs=tinysrgb&w=1400" "winelands-vineyards.jpg"
download "https://images.pexels.com/photos/417173/pexels-photo-417173.jpeg?auto=compress&cs=tinysrgb&w=1400" "winelands-mountains.jpg"
download "https://images.pexels.com/photos/1365425/pexels-photo-1365425.jpeg?auto=compress&cs=tinysrgb&w=1400" "winelands-town.jpg"
download "https://images.pexels.com/photos/2662116/pexels-photo-2662116.jpeg?auto=compress&cs=tinysrgb&w=1400" "signal-hill.jpg"
download "https://images.pexels.com/photos/373290/pexels-photo-373290.jpeg?auto=compress&cs=tinysrgb&w=1400" "va-waterfront.jpg"
download "https://images.pexels.com/photos/3889854/pexels-photo-3889854.jpeg?auto=compress&cs=tinysrgb&w=1400" "boulders-penguins.jpg"
download "https://images.pexels.com/photos/3601425/pexels-photo-3601425.jpeg?auto=compress&cs=tinysrgb&w=1400" "hermanus-coast.jpg"
download "https://images.pexels.com/photos/4666751/pexels-photo-4666751.jpeg?auto=compress&cs=tinysrgb&w=1400" "whale-coast.jpg"
download "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1400&q=80" "overberg-scenic.jpg"

# On-brand KhayrCape photography (already licensed for the site)
cp "$SRC/bo-kaap.jpg" "$PUB/bo-kaap.jpg"
cp "$SRC/bo-kaap-table-mountain.JPG" "$PUB/cape-town-city.jpg"
cp "$SRC/kirstenbosch-botanical-gardens.jpg" "$PUB/companies-garden.jpg"
cp "$SRC/chapmans-peak.jpg" "$PUB/chapmans-peak.jpg"
cp "$SRC/cape-point.jpg" "$PUB/cape-point.jpg"
cp "$SRC/campsbay.JPG" "$PUB/camps-bay-sunset.jpg"
cp "$SRC/clifton.JPG" "$PUB/clifton-coast.jpg"

bash "$ROOT/scripts/compress-images.sh"
echo "Experience images ready in $PUB"
