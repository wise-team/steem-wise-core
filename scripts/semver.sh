#!/usr/bin/env bash
set -e # fail on first error
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/.." # parent dir of scripts dir
cd "${DIR}"

VERSION=$1

if [ -z "${VERSION}" ]; then
    echo "You must specify new version"
    exit 1
fi


REQUIRED_BRANCH="master"
if [ "$(git rev-parse --abbrev-ref HEAD)" != "${REQUIRED_BRANCH}" ]; then
    echo "You must be on a \"${REQUIRED_BRANCH}\" branch to do semver"
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


echo "Creating git tag"
git add package.json package-lock.json
git commit -m "Semver ${VERSION}"
git push
git tag -a "v${VERSION}" -m "Steem WISE core library version ${VERSION}"
git push --tags
echo "Done creating tag"

echo "Publishing to npmjs.com registry"
npm publish

echo "Done"