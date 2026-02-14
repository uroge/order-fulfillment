FROM node:20-alpine AS build
WORKDIR /workspace

COPY package.json yarn.lock nx.json tsconfig.base.json .yarnrc ./
COPY apps ./apps
COPY libs ./libs

RUN yarn install --frozen-lockfile
RUN yarn nx run api-gateway:build && yarn nx run api-gateway:prune

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /workspace/dist/apps/api-gateway/package.json ./package.json
COPY --from=build /workspace/dist/apps/api-gateway/yarn.lock ./yarn.lock
COPY --from=build /workspace/dist/apps/api-gateway/workspace_modules ./workspace_modules
RUN yarn install --frozen-lockfile --production

COPY --from=build /workspace/dist/apps/api-gateway ./

EXPOSE 3000
CMD ["node", "main.js"]
