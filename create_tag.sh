#!/usr/bin/env bash
set -e

usage() {
  echo "Usage: $0 [--version <version>] <message>"
  exit 1
}

VERSION=""
MESSAGE=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --version)
      VERSION="$2"
      shift 2
      ;;
    --version=*)
      VERSION="${1#--version=}"
      shift
      ;;
    -*)
      echo "Unknown option: $1"
      usage
      ;;
    *)
      MESSAGE="$1"
      shift
      ;;
  esac
done

if [[ -z "$MESSAGE" ]]; then
  echo "Error: message is required"
  usage
fi

if [[ -z "$VERSION" ]]; then
  LATEST=$(git tag -l 'v*' | grep -E '^v[0-9]+\.[0-9]+\.[0-9]+$' | sort -V | tail -1)
  if [[ -z "$LATEST" ]]; then
    VERSION="1.0.0"
  else
    IFS='.' read -r MAJOR MINOR PATCH <<< "${LATEST#v}"
    PATCH=$((PATCH + 1))
    VERSION="${MAJOR}.${MINOR}.${PATCH}"
  fi
fi

TAG="v${VERSION}"

echo "Creating tag $TAG..."
git tag -a "$TAG" -m "$MESSAGE"
git push origin "$TAG"
echo "Done: $TAG"
