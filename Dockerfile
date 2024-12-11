# Step 1: Build the application
FROM node:18-alpine AS builder

WORKDIR /app

# ส่งผ่าน build-time arguments
ARG STRIPE_SECRET_KEY
ARG STRIPE_PUBLISHABLE_KEY
# ... args อื่นๆ ที่จำเป็น

# กำหนด environment variables สำหรับ build stage
ENV STRIPE_SECRET_KEY=sk_test_51QRb5aH4oklz2WpCpJu337a30yF1sC9Ah7XdZIVKfSs1VS5ZcxKYKgVJRJBsixc7p2AMnoh5hLQszcA1p8qxue1l00Sxqc0Mts
ENV STRIPE_PUBLISHABLE_KEY=pk_test_51QRb5aH4oklz2WpCAp8FDVr15dC0m0p9nyIdYm9JFzXnZuzID4yBE0Fz37WqJGOlaNzP7n4uHNn7ttsJsdwE21Yw005CZy1QqN
# ... envs อื่นๆ

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

# คัดลอก built files และ dependencies ที่จำเป็น
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
# ... files อื่นๆ ที่จำเป็น

# Install bash for using wait-for-it
RUN apk add --no-cache bash

# Install libssl
RUN apk add --no-cache openssl

EXPOSE 3000

# Run the application with wait-for-it to wait for MySQL
CMD ["./wait-for-it.sh", "db:5432", "--", "npm", "run", "start"]