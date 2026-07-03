# 第一阶段：构建
FROM node:18-alpine AS builder
WORKDIR /app

# 由于是 monorepo，需要复制整个 workspace 结构，但只安装 client 所需依赖
COPY pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/client/package.json ./packages/client/
RUN npm install -g pnpm && pnpm install --frozen-lockfile --filter @team-kanban/client

COPY packages/client/ ./packages/client/
RUN pnpm --filter @team-kanban/client build

# 第二阶段：nginx 提供静态文件
FROM nginx:alpine
COPY --from=builder /app/packages/client/dist /usr/share/nginx/html

# 添加 nginx 配置，支持 SPA 路由
COPY packages/client/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]