#!/usr/bin/env bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )" # https://stackoverflow.com/questions/59895/getting-the-source-directory-of-a-bash-script-from-within
typescript-json-schema \
    --strictNullChecks --required --out "$DIR/wise-schema.json" "$DIR/*-schema.ts" "wise_operation"
cp "$DIR/wise-schema.json" "$DIR/../../../../dist/protocol/versions/v2/wise-schema.json"