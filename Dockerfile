FROM node:20 AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src/ ./src/

RUN npm run build

FROM node:20

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

# Copy docs folder for RAG ingestion (if present)
COPY docs/ ./docs/

EXPOSE 3002

CMD ["node", "dist/app.js"]
