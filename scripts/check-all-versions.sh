#!/bin/bash
# Kolla versioner för alla packages

PACKAGES=(
  "textbit"
  "elephant-ui"
  "elephant-api-npm"
  "textbit-plugins"
  "typescript-api-client"
)

echo "🔍 Checking all package versions..."
echo "===================================="
echo ""

for pkg in "${PACKAGES[@]}"; do
  if [ ! -d "$pkg" ]; then
    echo "⚠️  $pkg - NOT FOUND"
    continue
  fi
  
  cd "$pkg"
  
  # Hämta upstream version
  git fetch upstream --tags 2>/dev/null
  UPSTREAM_TAG=$(git describe --tags --abbrev=0 upstream/main 2>/dev/null || echo "none")
  UPSTREAM_VERSION=${UPSTREAM_TAG#v}
  
  # Hämta nuvarande version
  CURRENT_VERSION=$(jq -r .version package.json 2>/dev/null || echo "unknown")
  
  # Status
  if [ "$UPSTREAM_VERSION" = "$CURRENT_VERSION" ]; then
    STATUS="✅ IN SYNC"
  else
    STATUS="⚠️  OUT OF SYNC"
  fi
  
  echo "📦 $pkg"
  echo "   Upstream: $UPSTREAM_VERSION"
  echo "   Current:  $CURRENT_VERSION"
  echo "   $STATUS"
  echo ""
  
  cd ..
done

echo "===================================="
echo ""
echo "To sync a package, run:"
echo "  ./scripts/sync-and-publish.sh <package-name>"
echo ""
