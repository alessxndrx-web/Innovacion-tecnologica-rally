# syntax=docker/dockerfile:1

FROM node:22-alpine AS base
WORKDIR /app
RUN apk add --no-cache openssl
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable

FROM base AS dependencies
# El esquema de Prisma se copia ANTES de instalar: el script `postinstall` del
# proyecto ejecuta `prisma generate` y sin `prisma/schema.prisma` la instalación
# aborta y con ella toda la construcción de la imagen.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY prisma ./prisma
RUN pnpm install --frozen-lockfile

FROM dependencies AS development
ENV NODE_ENV=development
COPY tsconfig.json tsconfig.build.json ./
COPY src ./src
EXPOSE 3000
CMD ["pnpm", "dev"]

FROM dependencies AS build
COPY tsconfig.json tsconfig.build.json ./
COPY src ./src
RUN pnpm build

FROM base AS production
ENV NODE_ENV=production
# Se conservan las dependencias completas para que `pnpm db:migrate` siga
# disponible en la imagen: las migraciones se aplican como paso previo al
# arranque, no desde el proceso del servidor.
COPY --from=build --chown=node:node /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=build --chown=node:node /app/prisma ./prisma
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "dist/server.js"]
