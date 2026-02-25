#!/bin/bash
# Script för att synka från upstream och publicera

set -e

PACKAGE_DIR=$1

if [ -z "$PACKAGE_DIR" ]; then
  echo "Usage: ./sync-and-publish.sh <package-dir>"
  echo "Example: ./sync-and-publish.sh textbit"
  exit 1
fi

if [ ! -d "$PACKAGE_DIR" ]; then
  echo "❌ Directory $PACKAGE_DIR not found"
  exit 1
fi

cd "$PACKAGE_DIR"

echo "🔍 Checking upstream for $PACKAGE_DIR..."

# Hämta upstream
git fetch upstream --tags

# Hämta senaste upstream tag
UPSTREAM_TAG=$(git describe --tags --abbrev=0 upstream/main 2>/dev/null || echo "none")
UPSTREAM_VERSION=${UPSTREAM_TAG#v}  # Ta bort 'v' prefix

# Hämta vår nuvarande version
CURRENT_VERSION=$(jq -r .version package.json)

echo ""
echo "📊 Version Status:"
echo "   Upstream: $UPSTREAM_VERSION"
echo "   Current:  $CURRENT_VERSION"
echo ""

if [ "$UPSTREAM_VERSION" = "$CURRENT_VERSION" ]; then
  echo "✅ Already up to date!"
  exit 0
fi

# Fråga användaren
read -p "Sync and publish as @dimelords/$(basename $PWD)@$UPSTREAM_VERSION? (y/N): " confirm

if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
  echo "❌ Aborted"
  exit 0
fi

# Synka från upstream
echo ""
echo "🔄 Merging upstream/main..."
git merge upstream/main || {
  echo "⚠️  Merge conflicts detected!"
  echo "Please resolve conflicts and run:"
  echo "  git add ."
  echo "  git commit"
  echo "  npm version $UPSTREAM_VERSION --no-git-tag-version"
  echo "  git add package.json"
  echo "  git commit --amend --no-edit"
  echo "  git tag v$UPSTREAM_VERSION"
  echo "  git push origin main --follow-tags"
  exit 1
}

# Sätt version
echo "📝 Setting version to $UPSTREAM_VERSION..."
npm version $UPSTREAM_VERSION --no-git-tag-version

# Commit version change
git add package.json package-lock.json 2>/dev/null || git add package.json
git commit -m "Bump to $UPSTREAM_VERSION (upstream sync)"

# Skapa tag
git tag "v$UPSTREAM_VERSION"

# Push
echo "🚀 Pushing to origin..."
git push origin main --follow-tags

echo ""
echo "✅ Done!"
echo "📦 Package will be published by GitHub Actions"
echo "   Check: https://github.com/dimelords/$PACKAGE_DIR/actions"
echo ""

cd ..
