# Use official Node 22 slim image
FROM node:22-slim

# Create app directory
WORKDIR /usr/src/app

# Copy package manifest
COPY package.json ./

# Install dependencies (omit dev dependencies)
RUN npm install --omit=dev

# Copy application source
COPY . .

# Expose port
EXPOSE 3000

# Run the app
CMD ["node", "index.mjs"]
