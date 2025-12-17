# Multi-stage build for dev-workflow MCP server
FROM node:20-alpine AS base

# Install build dependencies for native modules (better-sqlite3, pg)
RUN apk add --no-cache python3 make g++ postgresql-client

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (skip postinstall since we don't need state files at build time)
RUN npm ci --only=production --ignore-scripts

# Copy application code
COPY . .

# Create data directory for workflow state
RUN mkdir -p /app/data && \
    chown -R node:node /app

# Switch to non-root user
USER node

# Set environment variables
ENV NODE_ENV=production
ENV DEV_WORKFLOW_DB_TYPE=postgres

# The MCP server runs on stdio, no port exposure needed
# Communication happens via stdin/stdout

CMD ["node", "index.js"]
