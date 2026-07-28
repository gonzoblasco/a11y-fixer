FROM mcr.microsoft.com/playwright:v1.61.1-jammy

# Install GitHub CLI from official repo (apt version is ancient 2.4.0)
RUN curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg \
      | dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg 2>/dev/null && \
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" \
      | tee /etc/apt/sources.list.d/github-cli.list > /dev/null && \
    apt-get update && \
    apt-get install -y --no-install-recommends gh && \
    rm -rf /var/lib/apt/lists/*

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
