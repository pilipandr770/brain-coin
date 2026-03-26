# ─────────────────────────────────────────────────────────────
# Root Dockerfile — used by Render.com (production)
# Stage 1: build the React frontend
# Stage 2: run the Node backend, serving the built frontend
# ─────────────────────────────────────────────────────────────

# ── Stage 1: build frontend ───────────────────────────────────
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build
# Result: /app/frontend/dist

# ── Stage 2: production backend ───────────────────────────────
FROM node:20-alpine

WORKDIR /app

# Install backend dependencies (no devDeps)
COPY backend/package*.json ./
RUN npm install --omit=dev

# Copy backend source
COPY backend/ ./

# Copy the built React app into backend/public
# backend/server.js serves it via express.static('public') when NODE_ENV=production
COPY --from=frontend-builder /app/frontend/dist ./public

ENV NODE_ENV=production
# Render injects PORT automatically (default 10000)
EXPOSE 10000

CMD ["node", "server.js"]
