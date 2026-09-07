#!/usr/bin/env bash
# Curated experience route images — copies audited assets only.
# Source of truth: khayr-experience-images/ (Commons/Unsplash/on-brand; no Kirstenbosch→Company's Garden,
# no Chapman's/Blouberg in Hermanus/Sunset, no Wine Tram/tasting-room stock for Winelands).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PUB="$ROOT/client/public/experiences"
CURATED="$ROOT/khayr-experience-images"
SRC="$ROOT/client/public"
mkdir -p "$PUB" "$CURATED"

copy_curated() {
  local name="$1"
  if [[ ! -f "$CURATED/$name" ]]; then
    echo "Missing curated asset: $CURATED/$name" >&2
    echo "Add the audited file to khayr-experience-images/ before re-running." >&2
    exit 1
  fi
  cp "$CURATED/$name" "$PUB/$name"
}

# Hermanus — cliff path + whale + Overberg only (never Cape Town coast)
for f in \
  hermanus-cliff-path-coast.jpg \
  hermanus-cliff-path-view.jpg \
  hermanus-cliff-path-2.jpg \
  hermanus-view-from-cliff.jpg \
  southern-right-whale.jpg \
  overberg-landscape.jpg; do
  copy_curated "$f"
done

# City
for f in \
  unsplash-signal-hill-cape-town-dawn.jpg \
  cape-town-city-hall.jpg \
  unsplash-va-waterfront-harbour.jpg \
  companies-garden.jpg; do
  copy_curated "$f"
done
cp "$SRC/bo-kaap.jpg" "$PUB/bo-kaap.jpg"

# Sunset — Atlantic Seaboard only (Camps Bay + Clifton; no Blouberg / Table Bay)
copy_curated camps-bay-cape-town.jpg
copy_curated clifton-coast.jpg

# Winelands — scenic vineyards only (no Wine Tram / tasting-room)
for f in \
  unsplash-franschhoek-vineyard-mountains.jpg \
  unsplash-stellenbosch-vineyard-field.jpg \
  stellenbosch-vineyards.jpg \
  halal-meal-pause.jpg; do
  copy_curated "$f"
done

# Peninsula — Chapman's belongs here only
cp "$SRC/chapmans-peak.jpg" "$PUB/chapmans-peak.jpg"
cp "$SRC/cape-point.jpg" "$PUB/cape-point.jpg"
cp "$SRC/boulders-beach.jpg" "$PUB/boulders-penguins.jpg"

bash "$ROOT/scripts/compress-images.sh"
echo "Experience images ready in $PUB"
