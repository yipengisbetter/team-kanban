FROM node:18-alpine AS builder
WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/server/package.json ./packages/server/
COPY packages/server/prisma ./packages/server/prisma
RUN npm install -g pnpm && pnpm install --frozen-lockfile --filter @team-kanban/server

COPY packages/server/ ./packages/server/
RUN pnpm --filter @team-kanban/server build

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/packages/server/dist ./dist
COPY --from=builder /app/packages/server/node_modules ./node_modules
COPY --from=builder /app/packages/server/prisma ./prisma

ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "dist/index.js"]