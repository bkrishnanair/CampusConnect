# Technical Onboarding: CampusConnect Cloud-Native Foundation

**Objective**: This document outlines the containerization and CI/CD strategy implemented to prepare the CampusConnect application for cloud deployment, in fulfillment of the project's cloud-native requirements.

---

### 1. System Architecture: Microservices

A **Microservices Architecture** was chosen to ensure scalability, resilience, and technological flexibility. This approach decouples the primary functions of the application into independently deployable services.

*   **Frontend Service (Next.js/React)**: Provides the user interface.
*   **Events API Service (Node.js/Express)**: Manages core business logic and data persistence.
*   **Notification Service (Python/Flask)**: Handles asynchronous background processing.

This separation ensures that a failure in one service (e.g., Notifications) does not impact the availability of others, thereby increasing system resilience.

### 2. Containerization with Docker

To ensure a consistent and reproducible runtime environment across all machines (local and cloud), each service has been containerized using Docker.

*   **Per-Service Dockerfiles**: Each service has a dedicated `Dockerfile` located in its respective `/applications` directory, tailored to its specific runtime and dependencies.
*   **Security**: Containers are configured to run with non-root user privileges, adhering to security best practices.

### 3. Local Orchestration with Docker Compose

The `docker-compose.yml` file orchestrates the entire application stack for local development and testing.

*   **Unified Startup**: A single command (`docker compose up --build`) builds, networks, and runs all five services (three application services plus PostgreSQL and Redis).
*   **Service Discovery**: Services communicate over a shared Docker network using service names (e.g., `http://events-api:8080`).
*   **Dependency Management**: Health checks are implemented to ensure services like PostgreSQL are fully operational before dependent application services start, preventing startup failures.

### 4. CI/CD with GitHub Actions & AWS ECR

An automated CI/CD pipeline has been established using GitHub Actions to build, secure, and store the container images.

*   **Trigger**: The workflow runs on every push to the `main` branch.
*   **Process**:
    1.  **Parallel Builds**: Builds Docker images for all three services concurrently.
    2.  **Security Scanning**: Integrates **Trivy** to scan images for critical vulnerabilities. A failed scan will halt the pipeline.
    3.  **Registry Push**: On success, images are pushed to **Amazon Elastic Container Registry (ECR)**, making them available for cloud deployment.

### 5. Project Status & Next Steps

*   **Current Status**: The application is fully containerized, and the CI/CD automation pipeline is complete. The system is ready for deployment.
*   **Next Steps (Infrastructure)**: Provision the AWS EKS (Kubernetes) cluster using Terraform.
*   **Next Steps (Deployment)**: Once the cluster is active, create Kubernetes manifests to deploy the container images from ECR.

The backend and CI/CD foundation is complete. The project is pending AWS credentials to finalize the ECR push configuration.
