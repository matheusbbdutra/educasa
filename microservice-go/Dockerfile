# Build stage
FROM golang:1.24-bookworm AS builder

WORKDIR /app

# Install dependencies (gcc para CGO)
RUN apt-get update && apt-get install -y gcc libc6-dev make git

# Copy go mod files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy source code
COPY . .

# Build the application com CGO habilitado
RUN CGO_ENABLED=1 GOOS=linux go build -a -installsuffix cgo -o worker ./cmd/worker

# Runtime stage
FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y ca-certificates tzdata && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Set timezone
ENV TZ=America/Sao_Paulo

# Copy binary from builder
COPY --from=builder /app/worker .

# Create directory for temporary exports
RUN mkdir -p /tmp/exports

# Expose port
EXPOSE 8080

# Run the application
CMD ["./worker"]
