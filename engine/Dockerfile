# Travel AI Engine — Production Dockerfile
FROM python:3.12-slim

# Prevent Python from buffering stdout/stderr and writing .pyc files
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONPATH="/app:/app/engine" \
    PORT=8000

# Install OS-level dependencies (ffmpeg for media extraction, curl for health checks)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy dependency requirements first to leverage Docker layer caching
COPY engine/requirements.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy engine application code
COPY engine/ engine/

EXPOSE 8000

# Production Healthcheck Probe
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

# Production server execution via Uvicorn with proxy headers enabled
CMD ["uvicorn", "engine.app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4", "--proxy-headers", "--forwarded-allow-ips", "*"]
