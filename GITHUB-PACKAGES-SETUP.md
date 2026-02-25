# GitHub Packages Setup Guide - Privat NPM Registry

## Översikt

GitHub Packages är ett privat npm registry där:
- ✅ Paketen är "publika" i ditt GitHub org men kräver authentication
- ✅ Gratis för publika repos
- ✅ Endast användare med GitHub token kan installera
- ✅ Ingen kan komma åt utan ditt godkännande

## Steg 1: Skapa Personal Access Token

1. Gå till: https://github.com/settings/tokens/new
2. Token name: npm-publish-dimelords
3. Expiration: No expiration (eller 90 dagar)
4. Select scopes:
   - write:packages (publicera packages)
   - read:packages (installera packages)
   - repo (om repos är privata)
5. Generate token
6. KOPIERA TOKEN NU!

Token ser ut så här: ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

## Steg 2: Spara Token Lokalt

```bash
# Spara i ~/.npmrc
echo "//npm.pkg.github.com/:_authToken=DIN_TOKEN_HÄR" >> ~/.npmrc

# Eller använd environment variable (bättre säkerhet)
export GITHUB_TOKEN=ghp_xxxxxxxxxxxx
echo "//npm.pkg.github.com/:_authToken=\${GITHUB_TOKEN}" >> ~/.npmrc
```

## Steg 3: Konfigurera Packages för GitHub Packages

Kör detta script för alla packages:

```bash
#!/bin/bash
# setup-github-packages.sh

PACKAGES=(
  "textbit"
  "elephant-ui"
  "elephant-api-npm"
  "textbit-plugins"
  "typescript-api-client"
)

for pkg in "${PACKAGES[@]}"; do
  if [ ! -d "$pkg" ]; then
    echo "Skip $pkg (not found)"
    continue
  fi
  
  echo "Configuring $pkg for GitHub Packages..."
  cd "$pkg"
  
  # Update package.json
  npm pkg set name="@dimelords/$(basename $PWD)"
  npm pkg set version="1.0.0"
  npm pkg set repository.type="git"
  npm pkg set repository.url="git+https://github.com/dimelords/$pkg.git"
  npm pkg set publishConfig.registry="https://npm.pkg.github.com"
  
  # Commit
  git add package.json
  git commit -m "Configure for GitHub Packages"
  
  cd ..
done
```

## Steg 4: Skapa Auto-Publish Workflow

För varje package, skapa .github/workflows/publish.yml:

```yaml
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
      
      - run: npm run build || true
      
      - run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## Steg 5: Första Publiceringen (Manuell Test)

```bash
cd textbit

# Test pack
npm pack --dry-run

# Publish
npm publish

# Framgång ser ut så här:
# npm notice Publishing to https://npm.pkg.github.com
# + @dimelords/textbit@1.0.0
```

## Steg 6: Konfigurera elephant-chrome

### Skapa .npmrc i projektet:

```bash
cd elephant-chrome

# Skapa .npmrc (används vid npm install)
cat > .npmrc << 'EOF'
@dimelords:registry=https://npm.pkg.github.com/
EOF

# Lägg till i .gitignore (viktigt!)
echo "
# NPM authentication
.npmrc.local
" >> .gitignore
```

### Uppdatera dependencies:

```bash
# Använd npm aliases
npm pkg set dependencies."@ttab/textbit"="npm:@dimelords/textbit@^1.0.0"
npm pkg set dependencies."@ttab/elephant-ui"="npm:@dimelords/elephant-ui@^1.0.0"
npm pkg set dependencies."@ttab/elephant-api"="npm:@dimelords/elephant-api@^1.0.0"
npm pkg set dependencies."@ttab/textbit-plugins"="npm:@dimelords/textbit-plugins@^1.0.0"

# Installera (kräver GITHUB_TOKEN environment variable)
export GITHUB_TOKEN=ghp_xxxxxxxxxxxx
npm install
```

## Steg 7: Uppdatera Dockerfile

```dockerfile
FROM node:24.13.0-slim AS build
WORKDIR /app

# Copy package files
COPY package.json package-lock.json .npmrc ./

# Setup authentication via build arg
ARG GITHUB_TOKEN
RUN echo "//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}" >> .npmrc

# Install
RUN npm ci

# Remove .npmrc for security
RUN rm .npmrc

# Build
COPY . .
RUN npm run build

# Production stage
FROM node:24.13.0-slim
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./
EXPOSE 5183
CMD ["npm", "start"]
```

Bygg med:
```bash
docker build --build-arg GITHUB_TOKEN=$GITHUB_TOKEN -t elephant-chrome:local .
```

## Steg 8: Uppdatera Kubernetes Deployment

Om du använder Kubernetes:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: npm-github-token
  namespace: elephant
type: Opaque
stringData:
  token: "ghp_xxxxxxxxxxxx"
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: npmrc
  namespace: elephant
data:
  .npmrc: |
    @dimelords:registry=https://npm.pkg.github.com/
---
# I deployment, använd init container för att sätta upp .npmrc
```

## Framtida Workflow

### Publicera ny version:

```bash
cd textbit

# Gör ändringar...
git commit -m "Add feature"

# Bump version
npm version patch  # 1.0.0 -> 1.0.1

# Push med tags
git push origin main --follow-tags

# GitHub Actions publicerar automatiskt!
```

### Installera i andra projekt:

```bash
# Sätt GITHUB_TOKEN
export GITHUB_TOKEN=ghp_xxxxxxxxxxxx

# Installera
npm install @dimelords/textbit
```

## Security

### Skydda Token:

```bash
# ALDRIG i git!
# Använd environment variables

# ~/.zshrc eller ~/.bashrc
export GITHUB_TOKEN=ghp_xxxxxxxxxxxx
```

### För CI/CD:

```bash
# GitHub Actions - använd secrets
# Settings -> Secrets -> Actions -> New secret
# Name: GITHUB_TOKEN
# Value: ghp_xxxxxxxxxxxx
```

### Rotera Token Regelbundet:

1. Skapa ny token (https://github.com/settings/tokens)
2. Uppdatera lokalt: ~/.npmrc
3. Uppdatera CI/CD secrets
4. Ta bort gammal token

## Verifiera

```bash
# Se var paketet ligger
npm view @dimelords/textbit dist.tarball

# Output:
# https://npm.pkg.github.com/download/@dimelords/textbit/...

# Lista dina packages
# Gå till: https://github.com/orgs/dimelords/packages
```

## Nästa Steg

1. Skapa GitHub token
2. Kör setup-github-packages.sh
3. Testa publicera textbit manuellt
4. Setup GitHub Actions för auto-publish
5. Uppdatera elephant-chrome att använda @dimelords packages
