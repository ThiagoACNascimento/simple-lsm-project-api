FROM node:24-alpine AS base
WORKDIR /app
RUN apk --no-cache add vips-tools

FROM base AS dev
ENV NODE_ENV=development
CMD ["node", "--watch", "index.ts"]

FROM base AS prod
ENV NODE_ENV=production
COPY package*.json .
RUN npm ci --omit=dev
COPY . .
CMD ["node", "index.ts"]