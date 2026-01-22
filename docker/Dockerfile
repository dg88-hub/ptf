# =============================================
# Dockerfile for PTF Framework
# =============================================
# This Dockerfile builds a container for running Playwright tests.
# It uses Microsoft's official Playwright image which includes
# all browsers and dependencies pre-installed.
#
# Build:
#   docker build -t ptf-tests -f docker/Dockerfile .
#
# Run:
#   docker run ptf-tests                           # Run all tests
#   docker run ptf-tests npx playwright test --grep @smoke  # Smoke only
#
# With environment:
#   docker run -e TEST_ENV=uat ptf-tests
#
# @see docker-compose.yml for easier orchestration
# =============================================

# =============================================
# Base Image
# =============================================
# Microsoft's official Playwright image includes:
# - Node.js 20
# - Chromium, Firefox, WebKit browsers
# - All system dependencies
FROM mcr.microsoft.com/playwright:v1.40.0-jammy

# =============================================
# Working Directory
# =============================================
WORKDIR /app

# =============================================
# Install Dependencies
# =============================================
# Copy package files first (for Docker layer caching)
# Dependencies only change when package.json changes
COPY package*.json ./

# Install production dependencies only
RUN npm ci

# =============================================
# Copy Source Code
# =============================================
# Copy everything after dependencies for better caching
COPY . .

# =============================================
# Build Step
# =============================================
# Install TypeScript globally for type checking
RUN npm install -g typescript

# Verify TypeScript compiles without errors
RUN npm run type-check

# =============================================
# Environment Variables
# =============================================
# CI mode optimizes for headless container execution
ENV CI=true
# Test environment (can be overridden at runtime)
ENV NODE_ENV=test

# =============================================
# Default Command
# =============================================
# Run all tests by default
# Override with: docker run ptf-tests npx playwright test --grep @smoke
CMD ["npx", "playwright", "test"]
