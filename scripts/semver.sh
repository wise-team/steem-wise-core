#!/usr/bin/env bash
set -e # fail on first error
set -x # output commands
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/.." # parent dir of scripts dir
cd "${DIR}"

VERSION=$1

if [ -z "${VERSION}" ]; then
    echo "You must specify new version"
    exit 1
fi


echo "Updating steem-wise-core to ${VERSION}"
node -e " \
var packageFileContents = require(\"./package.json\"); \
packageFileContents.version = \"${VERSION}\"; \
require('fs').writeFileSync(\"./package.json\", JSON.stringify(packageFileContents, null, 2), \"utf8\"); \
"
echo "Updating version succeeded"


echo "Building..."
npm install
echo "Build successful"


git add package.json package-lock.json
git commit -m "Semver ${VERSION}"
git tag -a "v${VERSION}" -m "Steem WISE core library version ${VERSION}"
npm publish

echo "Done"