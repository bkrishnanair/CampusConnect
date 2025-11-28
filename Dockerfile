# Stage 1: Builder
# This stage builds the Next.js application
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install all dependencies (including devDependencies for building)
RUN npm install

# Copy the rest of the application source code
COPY . .

# Build the Next.js application for production
RUN npm run build

# Stage 2: Runner
# This stage creates the final, lightweight production image
FROM node:18-alpine AS runner

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev

# Copy the built application from the builder stage
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./next.config.ts

# Expose the port the app runs on
EXPOSE 3000

# Set the command to start the app
CMD ["npm", "start"]
