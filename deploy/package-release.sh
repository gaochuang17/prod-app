#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STAGE_DIR="$(mktemp -d "${TMPDIR:-/tmp}/prod-app-release.XXXXXX")"
PACKAGE_DIR="$STAGE_DIR/package"
RELEASE_DIR="$ROOT_DIR/release"

trap 'rm -rf "$STAGE_DIR"' EXIT

cd "$ROOT_DIR"

echo "Building client..."
(cd client && npm ci && npm run build)

echo "Building server..."
(cd server && npm ci && npm run build)

echo "Collecting deployment files..."
rm -rf "$RELEASE_DIR"
mkdir -p "$RELEASE_DIR" \
  "$PACKAGE_DIR/client" \
  "$PACKAGE_DIR/server"

cp -R client/dist "$PACKAGE_DIR/client/dist"
cp -R server/dist "$PACKAGE_DIR/server/dist"
cp -R server/prisma "$PACKAGE_DIR/server/prisma"

cp server/package.json "$PACKAGE_DIR/server/package.json"
cp server/package-lock.json "$PACKAGE_DIR/server/package-lock.json"
cp server/prisma.config.ts "$PACKAGE_DIR/server/prisma.config.ts"
cp -R deploy "$PACKAGE_DIR/deploy"

echo "Creating release archive..."
tar -czf "$RELEASE_DIR/prod-app.tar.gz" -C "$STAGE_DIR" package

echo "Release ready: $RELEASE_DIR/prod-app.tar.gz"
