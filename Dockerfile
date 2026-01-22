# Use the official Playwright image with dependencies
FROM mcr.microsoft.com/playwright:v1.50.0-jammy

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including devDependencies)
RUN npm ci

# Copy the rest of the application
COPY . .

# Set environment variables
ENV CI=true
ENV TEST_ENV=staging

# Default command
CMD ["npx", "playwright", "test"]
