# Multi-stage Dockerfile for Google Cloud Run + Supabase
# Stage 1: Build
FROM node:24-alpine AS builder
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev) needed for build
RUN npm install

# Copy source code
COPY . .

# Build TypeScript and client
RUN npm run build:server
RUN npm run build:client

# Stage 2: Prune dev dependencies
FROM node:24-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev

# Stage 3: Runtime
FROM node:24-alpine
WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Copy built artifacts from builder
COPY --from=builder /app/dist ./dist
# Copy only production dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY package.json .


# Google Cloud Run requires the app to listen on PORT environment variable
# Default to 8080 if PORT is not set
EXPOSE 8080
ENV PORT=8080

# Health check (extended for slower startup)
# Cloud Run uses the first response to determine if container started
HEALTHCHECK --interval=30s --timeout=15s --start-period=60s --retries=5 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 8080) + '/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})" || exit 1

# Start the application with verbose logging for debugging
CMD ["node", "--trace-uncaught", "dist/server/index.js"]
