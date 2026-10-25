FROM python:3.11-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Copy project files
COPY pyproject.toml README.md ./
COPY data/ ./data/
COPY src/ ./src/

# Install dependencies
RUN pip install --no-cache-dir -e .

# FastMCP runs on stdio by default for introspection and tools calls
CMD ["python", "-m", "jobpilot.server"]
