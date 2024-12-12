# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

ENV NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51QRb5aH4oklz2WpCpJu337a30yF1sC9Ah7XdZIVKfSs1VS5ZcxKYKgVJRJBsixc7p2AMnoh5hLQszcA1p8qxue1l00Sxqc0Mts
ENV STRIPE_SECRET_KEY=sk_test_51QRb5aH4oklz2WpCpJu337a30yF1sC9Ah7XdZIVKfSs1VS5ZcxKYKgVJRJBsixc7p2AMnoh5hLQszcA1p8qxue1l00Sxqc0Mts
ENV NEXT_PUBLIC_API_URL=https://clustra.tech
ENV NEXT_PUBLIC_APP_URL=https://clustra.tech

COPY package*.json ./
COPY wait-for-it.sh ./

RUN chmod +x wait-for-it.sh
RUN npm install

COPY . .

RUN apk add --no-cache openssl
RUN npx prisma generate
RUN npm run build

COPY start.sh ./
RUN chmod +x start.sh

# Production stage
FROM node:18-alpine

WORKDIR /app

RUN apk add --no-cache ffmpeg openssl bash supervisor curl tzdata

# ติดตั้ง cron
RUN apk add --no-cache cronie

# Copy files from builder
COPY --from=builder /app/ ./

# Install production dependencies
RUN npm install --production \
    && chmod +x wait-for-it.sh

# สร้างไฟล์ cron job
RUN echo "* * * * * node /app/dist/worker/process-jobs.js >> /app/logs/process-jobs.log 2>&1" > /etc/crontabs/root

# สร้าง supervisor config เพื่อรัน cron และ start.sh พร้อมกัน
RUN mkdir -p /etc/supervisor/conf.d
RUN echo "[supervisord]\nnodaemon=true\n" > /etc/supervisor/conf.d/supervisord.conf
RUN echo "[program:cron]\ncommand=/usr/sbin/crond -f -l 2\nautostart=true\nautorestart=true\n" >> /etc/supervisor/conf.d/supervisord.conf
RUN echo "[program:nextjs]\ncommand=./start.sh\ndirectory=/app\nautostart=true\nautorestart=true\n" >> /etc/supervisor/conf.d/supervisord.conf

EXPOSE 3000

CMD ["supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]