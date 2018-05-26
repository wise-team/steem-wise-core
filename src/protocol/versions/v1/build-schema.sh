#!/usr/bin/env bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )" # https://stackoverflow.com/questions/59895/getting-the-source-directory-of-a-bash-script-from-within
typescript-json-schema \
    --strictNullChecks --required --out "$DIR/smartvotes.schema.json" "$DIR/*.schema.ts" "smartvotes_operation"
cp "$DIR/smartvotes.schema.json" "$DIR/../../../../dist/protocol/versions/v1/smartvotes.schema.json"