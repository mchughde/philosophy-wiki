#!/bin/bash
# Philosophy Wiki — export to Philosophy_Wiki.docx
# Run this from anywhere: bash export.sh

set -e

WIKI_DIR="$(cd "$(dirname "$0")" && pwd)"
SCRIPTS_DIR="$WIKI_DIR/scripts"
OUT="$WIKI_DIR/Philosophy_Wiki.docx"

# Install the docx npm package on first run
if [ ! -d "$SCRIPTS_DIR/node_modules/docx" ]; then
  echo "Installing dependencies (first run only)..."
  cd "$SCRIPTS_DIR" && npm install
fi

echo "Generating $OUT ..."
node "$SCRIPTS_DIR/generate.js" "$WIKI_DIR" "$OUT"

echo "Applying mirror margins..."
python3 "$SCRIPTS_DIR/patch_mirror_margins.py" "$OUT"

echo ""
echo "Done. Open Philosophy_Wiki.docx to view."
