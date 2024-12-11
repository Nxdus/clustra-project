# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# กำหนด environment variables สำหรับ build stage
ENV NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51QRb5aH4oklz2WpCpJu337a30yF1sC9Ah7XdZIVKfSs1VS5ZcxKYKgVJRJBsixc7p2AMnoh5hLQszcA1p8qxue1l00Sxqc0Mts
ENV STRIPE_SECRET_KEY=sk_test_51QRb5aH4oklz2WpCpJu337a30yF1sC9Ah7XdZIVKfSs1VS5ZcxKYKgVJRJBsixc7p2AMnoh5hLQszcA1p8qxue1l00Sxqc0Mts
ENV NEXT_PUBLIC_API_URL=https://clustra.tech
ENV NEXT_PUBLIC_APP_URL=https://clustra.tech

# Copy package files
COPY package*.json ./
COPY wait-for-it.sh ./

# ให้สิทธิ์การเรียกใช้งาน wait-for-it.sh
RUN chmod +x wait-for-it.sh

# ติดตั้ง dependencies ทั้งหมดรวมถึง devDependencies
RUN npm install

# Copy all files
COPY . .

# ติดตั้ง dependencies ที่จำเป็นสำหรับ Prisma และ wait-for-it
RUN apk add --no-cache openssl

RUN npx prisma generate
RUN npm run build

# Copy start script
COPY start.sh ./
RUN chmod +x start.sh

# Production stage
FROM node:18-alpine

WORKDIR /app

# ติดตั้ง dependencies ที่จำเป็นใน production stage ทั้งหมดในครั้งเดียว
RUN apk add --no-cache openssl bash

# Copy ทุกไฟล์จาก builder stage
COPY --from=builder /app/ ./

# Install production dependencies only
RUN npm install --production \
    && chmod +x wait-for-it.sh

EXPOSE 3000

CMD ["./start.sh"]