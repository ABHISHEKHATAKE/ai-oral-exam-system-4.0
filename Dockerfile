# ---- Base image ----
FROM python:3.11-slim

# ---- Environment variables ----
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Cargo must write to a writable path
ENV CARGO_HOME=/tmp/cargo
ENV RUSTUP_HOME=/tmp/rustup

# ---- System dependencies ----
RUN apt-get update && apt-get install -y \
    curl \
    build-essential \
    git \
    && rm -rf /var/lib/apt/lists/*

# ---- Install Rust ----
RUN curl https://sh.rustup.rs -sSf | sh -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"

# ---- Install maturin ----
RUN pip install --no-cache-dir maturin

# ---- Set work directory ----
WORKDIR /app

# ---- Copy project files ----
COPY pyproject.toml ./
COPY . .

# ---- Install Python dependencies ----
RUN pip install --no-cache-dir .

# ---- Expose port (if web app) ----
EXPOSE 8000

# ---- Start command (example: FastAPI) ----
CMD ["python", "main.py"]
