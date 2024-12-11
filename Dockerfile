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

# ติดตั้ง dependencies ทั้งหมดรวมถึง devDependencies
RUN npm install
RUN npm install -D autoprefixer postcss tailwindcss @types/postcss-load-config

# Copy all files
COPY . .

# ติดตั้ง dependencies ที่จำเป็นสำหรับ Prisma
RUN apk add --no-cache openssl

RUN npx prisma generate
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# ติดตั้ง dependencies ที่จำเป็นใน production stage
RUN apk add --no-cache openssl

# Copy ทุกไฟล์จาก builder stage
COPY --from=builder /app/ ./

# Install production dependencies only
RUN npm install --production

EXPOSE 3000

CMD ["npm", "start"]