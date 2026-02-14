FROM node:20-alpine AS build
WORKDIR /workspace

COPY package.json yarn.lock nx.json tsconfig.base.json .yarnrc ./
COPY apps ./apps
COPY libs ./libs

RUN yarn install --frozen-lockfile
RUN yarn nx run orders-service:build && yarn nx run orders-service:prune

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /workspace/dist/apps/orders-service/package.json ./package.json
COPY --from=build /workspace/dist/apps/orders-service/yarn.lock ./yarn.lock
COPY --from=build /workspace/dist/apps/orders-service/workspace_modules ./workspace_modules
RUN yarn install --frozen-lockfile --production

COPY --from=build /workspace/dist/apps/orders-service ./

EXPOSE 3002
CMD ["node", "main.js"]
