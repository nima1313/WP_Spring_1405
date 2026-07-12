# Nava backend — Django + DRF, managed by uv (Python 3.12 pinned).
FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    UV_PROJECT_ENVIRONMENT=/app/.venv \
    PATH="/app/.venv/bin:$PATH"

# uv for fast, reproducible installs from the committed lockfile.
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

# Install dependencies first (cached until the lockfile changes).
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev

# Then the source.
COPY . .

# Data/media live on mounted volumes (see docker-compose.yml).
RUN mkdir -p /app/data /app/media

EXPOSE 8321

ENTRYPOINT ["/app/entrypoint.sh"]
