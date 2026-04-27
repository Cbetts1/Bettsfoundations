FROM node:20-alpine AS base
WORKDIR /app

# Install only production deps
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev && npm cache clean --force

COPY src ./src

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup \
 && mkdir -p /app/uploads /data \
 && chown -R appuser:appgroup /app /data

USER appuser

EXPOSE 4000
ENV NODE_ENV=production

CMD ["node", "src/index.js"]
