# Data Integration Service Dockerfile
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    curl \
    libpq-dev \
    libmagic1 \
    poppler-utils \
    tesseract-ocr \
    libreoffice \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create storage directories
RUN mkdir -p /app/storage/uploads /app/storage/processed /app/storage/temp

# Set permissions
RUN chmod -R 755 /app/storage

# Expose ports
EXPOSE 8001 8002 8003

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8001/health || exit 1

# Start the application
CMD ["python", "main.py"]
