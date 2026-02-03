#!/bin/bash

# Define source
SOURCE="core-schemas/"

# Define destinations
PY_DEST="python-pkg/src/drh_target/schemas/"
TS_DEST="typescript-pkg/src/schemas/"

# Create directories if they don't exist
mkdir -p "$PY_DEST"
mkdir -p "$TS_DEST"

# Sync and DELETE files not present in source
# -a: archive mode (preserves permissions/times)
# -v: verbose (shows what is happening)
# --delete: removes files in destination that aren't in source
rsync -av --delete "$SOURCE" "$PY_DEST"
rsync -av --delete "$SOURCE" "$TS_DEST"

echo "✅ Schemas synchronized (and cleaned) to Python and TypeScript packages."