# Use a slim Python base image
FROM python:3.12-slim

WORKDIR /app

# Copy requirements file first to leverage Docker cache
COPY applications/notification-service/requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY applications/notification-service/*.py ./

# Create a non-root user 'python' with a specific UID (Debian-compatible)
RUN set -eux; \
    if command -v addgroup >/dev/null 2>&1; then \
      addgroup --system python || true; \
    else \
      groupadd -r python || true; \
    fi; \
    if command -v adduser >/dev/null 2>&1; then \
      adduser --system --uid 1001 --ingroup python --disabled-password --no-create-home python || true; \
    else \
      useradd -r -u 1001 -g python -s /usr/sbin/nologin python || true; \
    fi

# Switch to the non-root user
USER python

# Expose the application port
EXPOSE 8000

# Healthcheck to verify the service is running
HEALTHCHECK --interval=30s --timeout=3s \
  CMD python -c "import requests; requests.get('http://localhost:8000/health', timeout=3)" || exit 1

# Command to run the application
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "app:app"]
