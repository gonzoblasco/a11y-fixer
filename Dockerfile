FROM mcr.microsoft.com/playwright:v1.61.1-jammy

# Install GitHub CLI for posting PR comments
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        gh \
    && rm -rf /var/lib/apt/lists/*

# Copy the entire repo (not just dist/) so npm ci can install all deps
COPY . /action/

# Install all dependencies including Playwright
# Playwright browsers are already in the base image
RUN cd /action && npm ci

# Compile TypeScript to dist/
RUN cd /action && npx tsc

WORKDIR /github/workspace

# The action entry point — compiled from src/action.ts
ENTRYPOINT ["node", "/action/dist/action.js"]
