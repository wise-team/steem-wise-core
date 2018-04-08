#!/usr/bin/env bash

npm install tslint typescript-json-schema

echo "Converting ts to json-schema..."

./node_modules/typescript-json-schema/bin/typescript-json-schema --strictNullChecks --required --out "smartvotes.schema.json" "ts/*.schema.ts" "smartvotes_transaction"

echo "Done."