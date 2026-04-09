# Keycloak configuration
AUTH_SECRET=...
AUTH_KEYCLOAK_ID=elephant
AUTH_KEYCLOAK_SECRET=...
AUTH_KEYCLOAK_ISSUER=https://...
AUTH_KEYCLOAK_IDP_HINT=saml
AUTH_POST_LOGOUT_URI=http://localhost:5173/elephant
ELEPHANT_CHROME_CLIENT_ID=elephant-chrome
ELEPHANT_CHROME_CLIENT_SECRET=...

# Repository
REPOSITORY_URL=https://...

# User API
USER_URL=http://localhost:1180

# Redis cache and pub/sub
# rediss://user:pass@host:port for TLS
# redis://localhost:6379 for no-tls, no-auth
REDIS_URL=

# Opensearch index
INDEX_URL="https://...se:443"

# Websocket
WS_URL=https:// ...

# Image resource (TT News API)
CONTENT_API_URL=https://api.tt.se
IMAGE_BASE_URL=https:// ...

# TT API credentials (optional - only needed if using TT News image service)
# Get these from TT Nyhetsbyrån: https://tt.se
TT_API_KEY=your-api-key-here
TT_AGREEMENT_ID=your-agreement-id

# Spelling backend
SPELLCHECK_URL=https:// ...

# Baboon print backend
BABOON_URL=https:// ...

# Server configuration
PROTOCOL=http
HOST=localhost
PORT=5183
BASE_URL=/elephant


FARO_URL=
FARO_NAME=
PYROSCOPE_URL=

SYSTEM_LANGUAGE=

