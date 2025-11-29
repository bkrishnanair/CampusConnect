# Use a lightweight Node.js base image
FROM node:20-alpine

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

WORKDIR /usr/src/app

# Copy package.json and package-lock.json to leverage Docker cache
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy the rest of the application code
COPY . .

# Create a non-root user 'nodejs' with a specific UID
RUN addgroup -S nodejs && adduser -S nodejs -G nodejs -u 1001

# Switch to the non-root user
USER nodejs

# Expose the application port
EXPOSE 8080

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s \
  CMD ["node", "healthcheck.js"]

# Use dumb-init to start the application
CMD ["dumb-init", "node", "server.js"]
