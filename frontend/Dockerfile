# Stage 1: Build React Application
FROM node:22-alpine AS build

WORKDIR /app

# Copy package descriptors
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application source code
COPY . .

# Set environment variables for production build
ENV VITE_API_BASE_URL=/api/inventory/
ENV VITE_AUTH_BASE_URL=/api/auth/

# Build client for production
RUN npm run build

# Stage 2: Production Server
FROM nginx:alpine

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy React build artifacts
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
