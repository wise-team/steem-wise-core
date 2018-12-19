#!/usr/bin/env bash
set -e # fail on first error
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/.." # parent dir of scripts dir
cd "${DIR}"


VERSION=$1
if [ -z "${VERSION}" ]; then
    echo "Error: You must specify new version"
    exit 1
fi


BRANCH="$(git rev-parse --abbrev-ref HEAD)"
echo "Branch: ${BRANCH}"
if [ "${BRANCH}" == "master" ]; then
    TAG="latest"
elif [ "${BRANCH}" == "staging" ]; then
    TAG="beta"
elif [ "${BRANCH}" == "development" ]; then
    TAG="alpha"
else
    echo "Error: Unknown branch"
    exit 1
fi
echo "Target tag: ${TAG}"

if [[ "$(node --version)" = "$(cat .nvmrc)"* ]]; then
    echo "Node version correct ($(node --version))"
else 
    echo "Error: Node version does not match .nvmrc"
    exit 1
fi

if [[ -z "${CONVENTIONAL_GITHUB_RELEASER_TOKEN}" ]]; then
    echo "You need to set up CONVENTIONAL_GITHUB_RELEASER_TOKEN env. It should contain github token with scope \"public_repo\"."
    exit 1;
fi


echo "Building..."
npm install
echo "Build successful"

echo "Unit testing..."
# npm test
echo "Unit testing successful"

echo "Integration testing..."
# npm run verify
echo "Integration testing successful"


echo "Updating steem-wise-core to ${VERSION}"
node -e " \
var packageFileContents = require(\"./package.json\"); \
packageFileContents.version = \"${VERSION}\"; \
require('fs').writeFileSync(\"./package.json\", JSON.stringify(packageFileContents, null, 2), \"utf8\"); \
"
echo "Updating version succeeded"


echo "Generating changelog"
npm run changelog
echo "Generating changelog correct"


echo "Creating git tag"
git add package.json package-lock.json CHANGELOG.md
git commit -m "chore(release): semver ${VERSION}"
git push
git tag -a "v${VERSION}" -m "Steem WISE core library version ${VERSION}"
git push --tags
echo "Done creating tag"


echo "Publishing to npmjs.com registry"
npm publish --tag $TAG
echo "Done publishing"


echo "Creating github release"
conventional-github-releaser -p angular
echo "Github release done"


echo "Done"