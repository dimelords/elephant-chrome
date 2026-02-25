# 📋 Versionshantering för @dimelords Packages

## Vald Strategi: Följ Upstream Versioner

Vi använder **samma versionsnummer** som upstream ttab.

## Exempel

```
ttab släpper: @ttab/textbit@1.0.11
Vi publicerar: @dimelords/textbit@1.0.11

ttab släpper: @ttab/textbit@1.0.12  
Vi synkar och publicerar: @dimelords/textbit@1.0.12
```

### Om du behöver en egen fix mellan upstream-releases:

```bash
# Upstream: 1.0.11
# Du behöver en bugfix

npm version 1.0.11-dimelords.1
git tag v1.0.11-dimelords.1
git push origin main --follow-tags

# Publiceras: @dimelords/textbit@1.0.11-dimelords.1

# När upstream släpper 1.0.12:
# Du synkar och publicerar: @dimelords/textbit@1.0.12
```

## Daglig Användning

### Kolla status på alla packages

```bash
./scripts/check-all-versions.sh
```

Output:
```
📦 textbit
   Upstream: 1.0.11
   Current:  1.0.10
   ⚠️  OUT OF SYNC

📦 elephant-ui
   Upstream: 1.2.1
   Current:  1.2.1
   ✅ IN SYNC
```

### Synka och publicera ett package

```bash
./scripts/sync-and-publish.sh textbit
```

Detta:
1. ✅ Hämtar upstream version
2. ✅ Visar nuvarande vs upstream
3. ✅ Frågar om bekräftelse
4. ✅ Mergar från upstream
5. ✅ Sätter samma version som upstream
6. ✅ Commitar och taggar
7. ✅ Pushar (GitHub Actions publicerar automatiskt)

## Versionsregler

### Semantic Versioning

```
MAJOR.MINOR.PATCH

1.0.11
│ │ │
│ │ └─ Patch: Bugfixes (bakåtkompatibelt)
│ └─── Minor: Nya features (bakåtkompatibelt)
└───── Major: Breaking changes
```

### Pre-release Versioner

För egen fix mellan upstream-releases:

```
1.0.11-dimelords.1
       └─────────┘
       Pre-release suffix
```

Installeras med:
```bash
npm install @dimelords/textbit@1.0.11-dimelords.1
```

## Hålla Koll på Upstream

### Bevaka upstream releases

1. Gå till https://github.com/ttab/textbit/releases
2. Klicka "Watch" → "Custom" → "Releases"
3. Du får email när ttab släpper ny version

### Manuell koll

```bash
cd textbit
git fetch upstream --tags
git log --oneline --decorate upstream/main | head -10
```

## Vanliga Scenarios

### Scenario 1: Upstream släpper ny version

```bash
# 1. Kolla vad som är nytt
./scripts/check-all-versions.sh

# 2. Synka och publicera
./scripts/sync-and-publish.sh textbit

# 3. Uppdatera elephant-chrome (om du vill)
cd elephant-chrome
npm install @dimelords/textbit@latest
git add package.json package-lock.json
git commit -m "Update @dimelords/textbit"
```

### Scenario 2: Du behöver fixa en bug

```bash
cd textbit

# Gör din fix
git commit -m "Fix critical bug"

# Publicera pre-release
CURRENT=$(jq -r .version package.json)
npm version $CURRENT-dimelords.1 --no-git-tag-version
git add package.json
git commit -m "Release $CURRENT-dimelords.1"
git tag v$CURRENT-dimelords.1
git push origin main --follow-tags

# Använd i elephant-chrome
cd ../elephant-chrome
npm install @dimelords/textbit@$CURRENT-dimelords.1
```

### Scenario 3: Merge-konflikt vid sync

```bash
./scripts/sync-and-publish.sh textbit

# Om konflikt:
# 1. Lös konflikter manuellt
git add .
git commit

# 2. Kör resten manuellt
UPSTREAM_VERSION=$(git describe --tags --abbrev=0 upstream/main)
UPSTREAM_VERSION=${UPSTREAM_VERSION#v}
npm version $UPSTREAM_VERSION --no-git-tag-version
git add package.json
git commit --amend --no-edit
git tag v$UPSTREAM_VERSION
git push origin main --follow-tags
```

## Fördelar med Detta System

✅ **Tydligt** - version visar exakt upstream-koppling
✅ **Automatiskt** - GitHub Actions publicerar
✅ **Flexibelt** - kan göra egna fixes mellan upstream-releases
✅ **Enkelt** - scripts gör jobbet

## Tips

1. **Kör check-all-versions.sh regelbundet** (varje måndag?)
2. **Synka alla packages samtidigt** när upstream har stora updates
3. **Använd pre-release** för egna fixes
4. **Dokumentera i CHANGELOG.md** vad som kom från upstream vs egna ändringar
