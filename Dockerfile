FROM mcr.microsoft.com/playwright:v1.61.1-jammy

# Install GitHub CLI for posting PR comments
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        gh \
    && rm -rf /var/lib/apt/lists/*

# Copy the bundled action
COPY dist/ /action/dist/
COPY action.yml /action/action.yml

# Install playwright as a local dependency so require('playwright') resolves
RUN npm init -y --prefix /action && \
    npm install playwright@1.61.1 --prefix /action

WORKDIR /github/workspace

# The action entry point
ENTRYPOINT ["node", "/action/dist/index.js"]