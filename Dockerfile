# Use official Node.js LTS image (slim for smaller size)
FROM node:20-slim

# Install build tools needed for native modules (bcrypt, sqlite3)
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files first (layer caching for faster rebuilds)
COPY package*.json ./

# Install dependencies, rebuild native modules for Linux
RUN npm ci --omit=dev

# Copy all application files
COPY . .

# Create the .data directory for SQLite (will be mounted as a volume)
RUN mkdir -p /app/.data

# Expose the port the app runs on
EXPOSE 8080

# Set NODE_ENV to production
ENV NODE_ENV=production
ENV PORT=8080

# Start the server
CMD ["node", "server.js"]
