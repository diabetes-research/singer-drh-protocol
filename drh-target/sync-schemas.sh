#!/bin/bash
# Define source
SOURCE="core-schemas"

# Define destinations
PY_DEST="python-pkg/src/drh_target/schemas"
TS_DEST="typescript-pkg/src/schemas"

# Create directories if they don't exist
mkdir -p $PY_DEST
mkdir -p $TS_DEST

# Sync files (this overwrites the destinations with the source)
cp -r $SOURCE/*.json $PY_DEST/
cp -r $SOURCE/*.json $TS_DEST/

echo "✅ Schemas synchronized to Python and TypeScript packages."