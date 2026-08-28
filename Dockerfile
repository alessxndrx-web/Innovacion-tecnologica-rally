# syntax=docker/dockerfile:1

FROM node:22-alpine AS base
WORKDIR /app
RUN apk add --no-cache openssl

FROM base AS dependencies
COPY package*.json ./
# El repositorio inicial puede no incluir todavía package-lock.json. La primera
# instalación con Node debe generarlo; desde entonces se recomienda cambiar a
# `npm ci` para instalaciones reproducibles.
RUN npm install

FROM dependencies AS development
ENV NODE_ENV=development
COPY tsconfig.json tsconfig.build.json ./
COPY prisma ./prisma
COPY src ./src
RUN npm run db:generate
EXPOSE 3000
CMD ["npm", "run", "dev"]

FROM dependencies AS build
COPY tsconfig.json tsconfig.build.json ./
COPY prisma ./prisma
COPY src ./src
RUN npm run db:generate \
    && npm run build \
    && npm prune --omit=dev

FROM base AS production
ENV NODE_ENV=production
COPY --from=build --chown=node:node /app/package*.json ./
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=build --chown=node:node /app/prisma ./prisma
USER node
EXPOSE 3000
CMD ["npm", "start"]
