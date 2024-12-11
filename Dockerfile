# Step 1: Build the application
FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy source code
COPY . .

# Run Prisma generate
RUN npx prisma generate

# Build the application
RUN npm run build

# Download wait-for-it.sh
RUN apk add --no-cache curl bash && \
    curl -o wait-for-it.sh https://raw.githubusercontent.com/vishnubob/wait-for-it/master/wait-for-it.sh && \
    chmod +x wait-for-it.sh

# Step 2: Run the application
FROM node:18-alpine

WORKDIR /app

# Copy application and wait-for-it script from builder stage
COPY --from=builder /app ./

# Install bash for using wait-for-it
RUN apk add --no-cache bash

# Install libssl
RUN apk add --no-cache openssl

EXPOSE 3000

# Run the application with wait-for-it to wait for MySQL
CMD ["./wait-for-it.sh", "db:5432", "--", "npm", "run", "start"]