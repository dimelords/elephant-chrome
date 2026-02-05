FROM node:24.13.0-slim AS build

ARG npm_authtoken

WORKDIR /usr/src/app

# 1️⃣ Copy EVERYTHING first (local deps must exist)
COPY . .

# 2️⃣ Auth
RUN echo "@ttab:registry=https://npm.pkg.github.com/\n//npm.pkg.github.com/:_authToken=${npm_authtoken}" >> .npmrc

# 3️⃣ Install deps (file: paths now resolve)
RUN npm ci

# 4️⃣ Build local packages explicitly
RUN npm run build --workspaces || true

# or if not workspaces:
RUN cd elephant-ui && npm run build
RUN cd elephant-api-npm && npm run build

# 5️⃣ Build main app
RUN npm run build

# 6️⃣ Prune dev deps
RUN npm prune --omit=dev && rm -f .npmrc


FROM node:24.13.0-slim

WORKDIR /usr/src/app

COPY --from=build /usr/src/app /usr/src/app

EXPOSE 5183
CMD ["npm", "start"]