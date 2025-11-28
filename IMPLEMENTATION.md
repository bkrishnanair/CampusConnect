# Implementation Details & Design Rationale

This document provides a deeper dive into the technical decisions and design patterns used in the CampusConnect application.

## Microservices vs. Structured Monolith

The original project prompt called for a distributed microservices architecture with separate services for the frontend, events API, and notifications.

**Decision**: We've adapted this into a **"well-structured monolith"** using Next.js.

**Rationale**:
1.  **Simplified Development**: A single codebase, build process, and development server (`npm run dev`) dramatically simplifies the developer experience, especially for a "Starter Kit."
2.  **Reduced Operational Overhead**: Managing one container is simpler than orchestrating three separate services with their own networking, deployment pipelines, and environment configurations.
3.  **Clear Separation of Concerns**: By using Next.js API Routes, we still achieve a clean logical separation between the frontend presentation layer (React components in `/app`) and the backend business logic (API handlers in `/app/api`). This structure makes it easy to "break out" the API into a true microservice in the future if scale demands it.
4.  **Performance**: Co-locating the frontend and backend can lead to lower latency for data fetching, as they are part of the same application process.

The notification service is simulated within the Events API to demonstrate resilience patterns (e.g., using `try...catch` to handle a failing "downstream" service) without adding the complexity of another running process.

## Container Strategy

The application is containerized using a multi-stage Docker build to create a lean, production-optimized image.

**File**: `Dockerfile`

**Stage 1: `builder`**
- **Base Image**: `node:18-alpine`
- **Purpose**: This stage is dedicated to building the application. It installs all `devDependencies`, copies the source code, and runs `npm run build`. This compiles the Next.js app into an optimized `.next` directory.

**Stage 2: `runner`**
- **Base Image**: `node:18-alpine`
- **Purpose**: This is the final, lightweight production image.
- **Process**:
    1.  It installs *only* production dependencies (`npm ci --omit=dev`).
    2.  It copies the built application from the `builder` stage (`--from=builder`).
    3.  The final image exposes port 3000 and runs the application with `npm start`, which executes `next start`. This serves the application using Next.js's highly optimized production server.

**Why Multi-Stage?**
- **Security**: `devDependencies` and build tools are not included in the final image, reducing the potential attack surface.
- **Size**: The final image is significantly smaller because it doesn't contain the entire source code, build artifacts, or development-only packages. This leads to faster container registry pushes/pulls and quicker startup times.

## Observability Strategy: Structured JSON Logging

Observability is a critical component of modern cloud-native applications. Instead of plain-text logs, this application uses structured JSON logging.

**Implementation**: In the API routes (`/app/api/**`), logging is done by passing a JavaScript object to `console.log` or `console.error`.

```javascript
console.log({
  level: "INFO",
  message: "Notification sent for new event",
  service: "notification-service",
  event_title: newEvent.title
});
```

**Why Structured JSON?**
- **Machine-Readability**: Cloud logging platforms like **AWS CloudWatch Logs Insights**, Google Cloud Logging, or Datadog can automatically parse JSON.
- **Powerful Queries**: This enables powerful, fast queries. You can filter logs based on specific fields (e.g., `level = "ERROR"`, `service = "events-api"`).
- **Rich Context**: It's easy to add rich, contextual information to every log entry (e.g., request IDs, user IDs, event details), which is invaluable for debugging complex issues.
- **Standardization**: It enforces a consistent logging format across the entire application, making logs predictable and easier to work with.

## Future Roadmap

This starter kit provides a solid foundation. The following are logical next steps for evolving the application into a full-fledged production system.

- [ ] **Replace In-Memory Store with a Database**
    - [ ] Integrate a database client (e.g., Prisma or Drizzle ORM).
    - [ ] Connect to a managed database service like AWS RDS (PostgreSQL) or Vercel Postgres.
    - [ ] Update API routes to perform CRUD operations against the database.

- [ ] **Add User Authentication**
    - [ ] Implement a solution like NextAuth.js or Clerk.
    - [ ] Protect the "Create Event" functionality so only authenticated users can access it.
    - [ ] Associate created events with a user ID.

- [ ] **Externalize the Notification Service**
    - [ ] Create a separate service (e.g., in Node.js, Python, or Go) for handling notifications.
    - [ ] Replace the simulated call in the Events API with a real HTTP request to the new service.
    - [ ] Consider using a message queue (like AWS SQS or RabbitMQ) for more robust, asynchronous communication between the Events API and Notification Service.

- [ ] **Enhance Frontend**
    - [ ] Add loading states for form submissions.
    - [ ] Implement optimistic UI updates for a faster perceived experience.
    - [ ] Add event filtering and search functionality.
    - [ ] Create a dedicated page for individual event details.

- [ ] **Improve CI/CD**
    - [ ] Set up a GitHub Actions workflow to automatically build and push the Docker image to a registry (e.g., Amazon ECR, Docker Hub).
    - [ ] Add automated testing (unit tests with Jest, end-to-end tests with Playwright or Cypress).
