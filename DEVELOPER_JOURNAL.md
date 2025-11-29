# Developer Journal: Getting CampusConnect Cloud-Ready

Hey Team,

This journal explains the work I've done over the last week to get our application ready for the cloud, as per the project requirements. The main goal was to containerize our apps so they can run anywhere—on our laptops or on AWS—in a consistent way.

### Part 1: Why We're Using Microservices (The "Band")

The professor wants a "Cloud-Native Application," which means it needs to be scalable and resilient. A single, monolithic application (where the frontend, backend, and everything else is one big program) is simple to start, but can be risky. If one small part crashes (like a notification feature), the whole app could go down.

So, we chose a **Microservices Architecture**. Think of it like a band:

*   **The Singer (Frontend)**: This is our Next.js/React app. It's what the user sees and interacts with. Its only job is to look good and talk to the backend.
*   **The Guitarist (Events API)**: This is our Node.js/Express backend. It's the brain. It handles creating events, saving them to the database, and is the core of our application.
*   **The Drummer (Notification Service)**: This is our Python/Flask app. It handles background tasks. When a new event is created, the Events API tells the Notification Service, which then does its job without slowing down the main API.

**Why is this better?** If the "drummer" (Notification Service) has an issue, the "singer" and "guitarist" can keep playing. The website stays online, which is key for resilience.

### Part 2: Solving "It Works on My Machine" with Docker

We all have different computers (Mac, Windows) and our AWS server will be Linux. To make sure our code runs exactly the same everywhere, we're using **Docker**.

Think of a Docker container as a sealed box. Inside each box, we put one of our services (e.g., the Events API) along with everything it needs to run (like the correct version of Node.js).

*   **The "Recipe" (`Dockerfile`)**: For each of our three services, I created a `Dockerfile`. This is a simple text file that gives Docker the step-by-step instructions to build one of these sealed boxes.
*   **Security First**: The Dockerfiles are configured to run our apps as a restricted user (not as the super-admin "root"), which is a standard security best practice.

### Part 3: Running Everything at Once with Docker Compose

Now we have three application containers, a database, and Redis. To run and test them all together, we use **Docker Compose**.

The `docker-compose.yml` file is like an instruction manual for our entire local setup. It defines all five services and connects them.

*   **One Command to Rule Them All**: Instead of opening five terminal windows, you can now just run `docker compose up --build`. This single command builds the containers, creates a private network for them, and starts everything in the correct order.
*   **Smart Networking**: The services can talk to each other using their names. For example, the frontend can make a request to `http://events-api:8080` without needing to know its IP address.
*   **Health Checks**: I added a rule to prevent startup errors. The Events API will wait until the Postgres database is fully healthy and ready for connections before it starts.

**Proof**: If you run the `docker compose up` command, you can open `http://localhost:3000`, create an event, and see the logs from all three services in your terminal. It all works together!

### Part 4: The Automation Pipeline to the Cloud (CI/CD)

To get our container "boxes" to AWS, we need an automated pipeline. We can't just email the files. This is where CI/CD (Continuous Integration/Continuous Deployment) comes in.

*   **The "Cloud Garage" (AWS ECR)**: Amazon Elastic Container Registry (ECR) is where we'll store our final Docker images. Think of it as GitHub, but for Docker images.
*   **The "Robot" (GitHub Actions)**: I've set up a workflow in `.github/workflows/ecr-publish.yml`. This is a "robot" that automates the process:
    1.  Anytime we push code to the `main` branch, the robot wakes up.
    2.  It builds the Docker images for all three services.
    3.  It runs a **Trivy security scan** on each image. If a critical vulnerability is found, the process stops to prevent deploying insecure code.
    4.  If the scan passes, it pushes the images to our "Cloud Garage" (ECR).

### Part 5: Where We Are and What's Next

My part is now complete. The application is fully containerized, and the CI/CD pipeline is built and ready to be connected to AWS.

*   **My Status**: Done with local setup and containerization.
*   **What's Next (Infrastructure Team)**: The next step is to use Terraform to build the actual servers and Kubernetes (EKS) cluster on AWS.
*   **What's Next (Kubernetes Team)**: Once the cluster is built and our images are in ECR, they will write the Kubernetes files to deploy our services to the cloud.

I'm currently waiting on the AWS credentials to activate the final step of the CI/CD pipeline. Let me know if you have any questions!
