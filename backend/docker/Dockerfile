FROM python:3.11-slim

# System deps
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        libpq-dev gcc libgeos-dev libproj-dev libgdal-dev && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python deps
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Expose port
EXPOSE 8000

# Run
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
