# Production image: small, non-root, read-only app files, data on a volume.
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0 STEPWISE_DB=/data/stepwise.db NEXT_TELEMETRY_DISABLED=1
WORKDIR /app
RUN addgroup -S app && adduser -S app -G app && mkdir /data && chown app:app /data
COPY --from=build --chown=root:root /app/.next/standalone ./
COPY --from=build --chown=root:root /app/.next/static ./.next/static
USER app
VOLUME ["/data"]
EXPOSE 3000
CMD ["node", "server.js"]
