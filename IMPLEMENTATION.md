# Implementation Details & Design Rationale

This document provides a deeper dive into the technical decisions and design patterns used in the CampusConnect application.

## Architecture: Distributed Microservices

The project is implemented using a **distributed microservices architecture** to ensure scalability, resilience, and separation of concerns, meeting the core requirements for a cloud-native application.

**Rationale**:
1.  **Scalability**: Each service can be scaled independently. If the Events API is under heavy load, we can scale it up without touching the Frontend or Notification services.
2.  **Resilience & High Availability**: The services are decoupled. A failure in the Notification Service will not bring down the main Events API or the user-facing Frontend.
3.  **Technology Flexibility**: Each service is built with the best technology for its job (Next.js for the frontend, Node.js/Express for the API, Python/Flask for notifications).
4.  **Team Autonomy**: In a larger team, different squads could own different services, allowing for independent development and deployment cycles.

Our architecture consists of three core application services and two backing infrastructure services:

*   **Frontend Service (Next.js/React)**: The user interface that runs on port `3000`. It provides the interactive web experience for students and faculty to view and create events.
*   **Events API Service (Node.js/Express)**: The central nervous system of the application, running on port `8080`. It handles business logic, data validation, and communication with the PostgreSQL database.
*   **Notification Service (Python/Flask)**: A background service on port `8000` responsible for handling asynchronous tasks like sending notifications.
*   **PostgreSQL Database**: The primary persistence layer for event data.
*   **Redis**: Used for caching, session management, or as a message broker (future enhancement).

## Containerization & Orchestration

### Docker Strategy
Each of the three application services has its own dedicated `Dockerfile` located in its respective `/applications` sub-directory.

-   **Independent Environments**: Each `Dockerfile` is tailored to its specific technology stack (Node.js, Python), ensuring that each service has a consistent, reproducible, and isolated environment.
-   **Production Optimization**: The Dockerfiles are configured for production, using best practices like multi-stage builds to create lean final images and running as non-root users (`node` or `python`) for enhanced security.

### Local Orchestration with Docker Compose
For local development and testing, the entire stack is orchestrated using a single `docker-compose.yml` file.

-   **One-Command Startup**: Developers can run `docker compose up --build` to build all images, create a shared network, and start all five services in the correct order.
-   **Service Discovery**: Services communicate with each other using their service names over a private Docker network (e.g., the Frontend calls the API at `http://events-api:8080`).
-   **Health Checks**: The `docker-compose.yml` includes `healthcheck` configurations to ensure that services like Postgres are fully ready before the applications that depend on them are started, preventing startup race conditions and errors.

## CI/CD: The Bridge to the Cloud

The project uses a CI/CD pipeline defined in `.github/workflows/ecr-publish.yml` to automate the process of building, securing, and storing our container images.

-   **Automation with GitHub Actions**: The workflow triggers automatically on any push to the `main` branch.
-   **Parallel Builds**: It efficiently builds the Docker images for all three services simultaneously.
-   **Security Scanning with Trivy**: Before an image is stored, it is scanned for known security vulnerabilities using Trivy. If a "CRITICAL" vulnerability is found, the pipeline fails, preventing insecure code from ever reaching the cloud registry.
-   **Push to AWS ECR**: Upon a successful scan, the tagged images are pushed to Amazon Elastic Container Registry (ECR), making them ready for deployment to a container orchestrator like AWS EKS.

## Observability: Structured JSON Logging

To ensure the system is observable and easy to debug, all services implement structured JSON logging.

**Example from Events API**:
```javascript
console.log({
  level: "INFO",
  message: "Event created successfully",
  service: "events-api",
  event_id: newEvent.id
});
```
**Why Structured JSON?**
-   **Machine-Readability**: Cloud logging platforms like AWS CloudWatch can automatically parse JSON, enabling powerful queries.
-   **Powerful Queries**: This allows us to filter logs based on specific fields (e.g., `level = "ERROR"`, `service = "notification-service"`).
-   **Rich Context**: It's easy to add contextual information to every log entry, which is invaluable for tracing requests across multiple services.
