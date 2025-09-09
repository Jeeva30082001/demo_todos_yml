# Use official Node 22 slim
FROM node:22-slim

# create app directory
WORKDIR /usr/src/app

# Install small system deps (if needed) and clean apt caches
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/*

# copy package manifest and install dependencies first (cache)
COPY package.json package-lock.json* ./
RUN npm install --omit=dev

# copy source
COPY . .

ENV PORT=3000
EXPOSE 3000

CMD ["node", "index.mjs"]
