# Development Dockerfile for React app
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Set Node.js memory options
ENV NODE_OPTIONS="--max-old-space-size=1024"

# Copy package files
COPY package*.json ./

# Install dependencies with optimizations
RUN npm install --legacy-peer-deps && \
    npm install --save react react-dom && \
    npm install --save-dev @babel/core @babel/preset-react && \
    npm install -g react-scripts && \
    npm cache clean --force

# Copy all frontend files
COPY . .

# Expose port
EXPOSE 3000

# Start development server
CMD ["npm", "start"]
