# syntax=docker/dockerfile:1

FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
ENV HUSKY=0
RUN pnpm install --frozen-lockfile --ignore-scripts

FROM deps AS build
COPY prisma ./prisma
COPY prisma.config.ts ./
COPY tsconfig.json tsconfig.build.json ./
COPY src ./src
RUN pnpm prisma:generate
RUN pnpm build

FROM base AS runner
ENV NODE_ENV=production
ENV HUSKY=0
WORKDIR /app

RUN addgroup -S nodejs && adduser -S nodejs -G nodejs \
  && mkdir -p storage/attachments \
  && chown -R nodejs:nodejs storage

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY prisma ./prisma
COPY prisma.config.ts ./
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY scripts/docker-entrypoint.sh ./scripts/docker-entrypoint.sh

RUN chmod +x ./scripts/docker-entrypoint.sh \
  && chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 3000) + '/health').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["./scripts/docker-entrypoint.sh"]
