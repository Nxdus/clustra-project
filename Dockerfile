# Base image
FROM node:18-alpine

# Install netcat and nginx
RUN apk add --no-cache netcat-openbsd nginx

WORKDIR /app

# Copy wait-for-it script
COPY wait-for-it.sh ./
RUN chmod +x wait-for-it.sh

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Copy prisma schema and generate client
COPY prisma ./prisma/
RUN npx prisma generate

# Build application
RUN npm run build

# Setup nginx
COPY nginx/conf.d/default.conf /etc/nginx/conf.d/default.conf
RUN mkdir -p /data/letsencrypt
RUN mkdir -p /run/nginx

# Expose ports
EXPOSE 3000 80 443

# Create start script
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'nginx' >> /app/start.sh && \
    echo 'npm run start' >> /app/start.sh && \
    chmod +x /app/start.sh

# Start both Nginx and Next.js with wait-for-it
CMD ["./wait-for-it.sh", "db:5432", "--", "/app/start.sh"]