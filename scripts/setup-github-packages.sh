#!/bin/bash
# Setup alla packages för GitHub Packages

set -e

PACKAGES=(
  "textbit"
  "elephant-ui"
  "elephant-api-npm"
  "textbit-plugins"
  "typescript-api-client"
)

echo "🔧 Setting up packages for GitHub Packages..."
echo ""

for pkg in "${PACKAGES[@]}"; do
  if [ ! -d "$pkg" ]; then
    echo "⚠️  Skip $pkg (directory not found)"
    continue
  fi
  
  echo "📦 Configuring $pkg..."
  cd "$pkg"
  
  # Uppdatera package.json
  PACKAGE_NAME=$(basename "$PWD")
  npm pkg set name="@dimelords/$PACKAGE_NAME"
  npm pkg set version="1.0.0"
  npm pkg set repository.type="git"
  npm pkg set repository.url="git+https://github.com/dimelords/$pkg.git"
  npm pkg set publishConfig.registry="https://npm.pkg.github.com"
  
  echo "   ✅ Updated package.json"
  
  # Skapa .github/workflows/publish.yml om den inte finns
  mkdir -p .github/workflows
  
  if [ ! -f .github/workflows/publish.yml ]; then
    cat > .github/workflows/publish.yml << 'WORKFLOW'
name: Publish to GitHub Packages

on:
  push:
    tags:
      - 'v*'

jobs:
  publish:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://npm.pkg.github.com'
          scope: '@dimelords'
      
      - run: npm ci
      
      - name: Build if build script exists
        run: npm run build || true
      
      - run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
WORKFLOW
    echo "   ✅ Created .github/workflows/publish.yml"
  fi
  
  # Commit changes
  git add package.json .github/workflows/publish.yml
  git commit -m "Configure for GitHub Packages publishing" || echo "   ℹ️  No changes to commit"
  
  echo ""
  cd ..
done

echo "✅ All packages configured!"
echo ""
echo "Next steps:"
echo "1. Push changes: git push origin main"
echo "2. Test publish manually: cd textbit && npm publish"
echo "3. Or create tag to auto-publish: git tag v1.0.0 && git push origin v1.0.0"
echo ""
