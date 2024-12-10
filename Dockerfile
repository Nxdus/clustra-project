# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# รับ build arguments
ARG STRIPE_SECRET_KEY
ARG NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

# กำหนดค่า environment variables สำหรับ build time
ENV STRIPE_SECRET_KEY=$STRIPE_SECRET_KEY
ENV NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

# ติดตั้ง OpenSSL และ dependencies ที่จำเป็น
RUN apk add --no-cache openssl

# Copy package files และติดตั้ง dependencies
COPY package*.json ./
RUN npm install

# Copy source files และ build
COPY . .
RUN npx prisma generate
RUN npm run build

# Production stage
FROM node:18-alpine AS runner

WORKDIR /app

# ติดตั้ง OpenSSL
RUN apk add --no-cache openssl

# Copy เฉพาะไฟล์ที่จำเป็นจาก builder stage
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/prisma ./prisma

# ติดตั้ง production dependencies
RUN npm ci --only=production

# Copy wait-for-it script
COPY wait-for-it.sh ./
RUN chmod +x wait-for-it.sh

EXPOSE 3000

CMD ["npm", "run", "start"]