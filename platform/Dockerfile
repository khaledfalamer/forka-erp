# Cloud Run image for the Forka Apps server
FROM node:22-slim
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev || npm install --omit=dev
COPY src ./src
COPY migrations ./migrations
COPY scripts ./scripts
ENV NODE_ENV=production
USER node
CMD ["node", "src/server.js"]
