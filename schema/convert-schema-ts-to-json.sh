#!/usr/bin/env bash

npm install tslint typescript-json-schema

./node_modules/typescript-json-schema/bin/typescript-json-schema --out "smartvotes.schema.json" --required "ts/*.schema.ts" "*"