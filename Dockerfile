FROM python:3.11-slim

# System dependencies za Pillow i psycopg2
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    libjpeg-dev \
    zlib1g-dev \
    libfreetype6-dev \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Anton font za clickbait overlay.
# Ako font već postoji u repo-u (assets/Anton-Regular.ttf), preskoči download.
RUN if [ ! -f assets/Anton-Regular.ttf ]; then \
      mkdir -p assets && \
      curl -fsSL -o assets/Anton-Regular.ttf \
        https://github.com/googlefonts/anton/raw/main/fonts/Anton-Regular.ttf; \
    fi && \
    test -s assets/Anton-Regular.ttf

ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app

CMD ["celery", "-A", "app.celery_app", "worker", "--loglevel=info", "--concurrency=2"]
