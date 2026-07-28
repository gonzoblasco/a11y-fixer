FROM mcr.microsoft.com/playwright:v1.61.1-jammy

# Copy the bundled action
COPY dist/ /action/dist/
COPY action.yml /action/action.yml

WORKDIR /github/workspace

# The action entry point
ENTRYPOINT ["node", "/action/dist/index.js"]