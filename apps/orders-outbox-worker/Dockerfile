FROM node:20-alpine AS build
WORKDIR /workspace

COPY package.json yarn.lock nx.json tsconfig.base.json .yarnrc ./
COPY apps ./apps
COPY libs ./libs

RUN yarn install --frozen-lockfile
RUN yarn nx run orders-outbox-worker:build && yarn nx run orders-outbox-worker:prune

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /workspace/dist/apps/orders-outbox-worker/package.json ./package.json
COPY --from=build /workspace/dist/apps/orders-outbox-worker/yarn.lock ./yarn.lock
COPY --from=build /workspace/dist/apps/orders-outbox-worker/workspace_modules ./workspace_modules
RUN yarn install --frozen-lockfile --production

COPY --from=build /workspace/dist/apps/orders-outbox-worker ./

CMD ["node", "main.js"]
