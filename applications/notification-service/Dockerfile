# Use a slim Python base image
FROM python:3.12-slim

WORKDIR /app

# Copy requirements file first to leverage Docker cache
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . .

# Create a non-root user 'python' with a specific UID
RUN addgroup -S python && adduser -S python -G python -u 1001

# Switch to the non-root user
USER python

# Expose the application port
EXPOSE 8000

# Healthcheck to verify the service is running
HEALTHCHECK --interval=30s --timeout=3s \
  CMD python -c "import requests; requests.get('http://localhost:8000/health', timeout=3)" || exit 1

# Command to run the application
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "app:app"]
