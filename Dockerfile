FROM node:22-bookworm-slim
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY public ./public
COPY worker ./worker
COPY scripts ./scripts
COPY drizzle ./drizzle
RUN npm run build
ENV HOST=0.0.0.0 PORT=8080 PHYSICS_DATABASE_PATH=/data/physics.sqlite
VOLUME ["/data"]
EXPOSE 8080
CMD ["node", "scripts/serve.mjs"]
