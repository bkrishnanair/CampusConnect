# ===== Stage 1: Builder =====
# Use a specific Node.js version on a lean base image
FROM node:18-alpine AS builder

# Set the working directory
WORKDIR /app

# Copy package.json and lock files
COPY package.json ./
COPY package-lock.json ./

# Install all dependencies (including devDependencies) for the build process
RUN npm install

# Copy the rest of the application source code
COPY . .

# Set production environment for the build
ENV NODE_ENV=production

# Build the Next.js application
# This creates an optimized production build in the .next directory
RUN npm run build

# ===== Stage 2: Runner =====
# Use the same lean Node.js base image for the final container
FROM node:18-alpine AS runner

# Set the working directory
WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Create a non-root user 'nextjs' with UID 1001 and GID 1001
# This is a security best practice to avoid running as root
RUN addgroup -g 1001 -S nextjs
RUN adduser -S nextjs -u 1001

# Copy only production dependencies from the builder stage
COPY --from=builder /app/node_modules ./node_modules
COPY package.json ./
COPY package-lock.json ./

# Install only production dependencies to keep the image small
RUN npm ci --omit=dev --ignore-scripts

# Copy the built Next.js application from the builder stage
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY next.config.ts ./

# Change ownership of the app files to the non-root user
RUN chown -R nextjs:nextjs /app

# Switch to the non-root user
USER nextjs

# Expose the port the app will run on (default for Next.js is 3000)
EXPOSE 3000

# The command to start the Next.js production server
# The `next start` command is optimized for production.
CMD ["npm", "start"]
