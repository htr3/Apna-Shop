# Dockerfile for Shopkeeper-Insights

# ---- Base Image ----
# Use a lightweight Node.js image
FROM node:20-alpine AS base
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# ---- Dependencies ----
# Install production dependencies
FROM base AS deps
RUN npm install --frozen-lockfile

# ---- Build ----
# Build the client and server
FROM deps AS build
COPY . .
RUN npm run build

# ---- Production Image ----
# Create a lean final image
FROM base AS production
ENV NODE_ENV=production
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/dist ./dist
COPY package.json .
COPY drizzle.config.ts .
COPY shared/ ./shared/

# Expose the port the app will run on (Google Cloud Run default is 8080)
EXPOSE 8080
ENV PORT=8080

# Start the application
CMD ["npm", "start"]