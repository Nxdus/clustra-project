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

RUN ls -al src/worker

# คอมไพล์เฉพาะไฟล์ process-jobs.ts
RUN npx tsc src/worker/process-job.ts --outDir dist/worker

# Production stage
FROM node:18-alpine
WORKDIR /app

RUN apk add --no-cache ffmpeg openssl bash supervisor curl tzdata cronie coreutils

COPY --from=builder /app/ ./
RUN npm install --production && chmod +x wait-for-it.sh

RUN mkdir -p /app/logs
RUN chown root:root /app/logs

# ใช้ /etc/crontabs/root แทน /var/spool/cron/crontabs
RUN echo "* * * * * /usr/local/bin/node /app/dist/worker/process-job.js >> /app/logs/process-jobs.log 2>&1" > /etc/crontabs/root
RUN chmod 600 /etc/crontabs/root && chown root:root /etc/crontabs/root

RUN mkdir -p /etc/supervisor/conf.d
# เขียน Supervisor config ด้วย echo ทีละบรรทัด
RUN echo "[supervisord]" > /etc/supervisor/conf.d/supervisord.conf
RUN echo "nodaemon=true" >> /etc/supervisor/conf.d/supervisord.conf
RUN echo "user=root" >> /etc/supervisor/conf.d/supervisord.conf

RUN echo "[program:cron]" >> /etc/supervisor/conf.d/supervisord.conf
RUN echo "command=/usr/sbin/crond -n" >> /etc/supervisor/conf.d/supervisord.conf
RUN echo "autostart=true" >> /etc/supervisor/conf.d/supervisord.conf
RUN echo "autorestart=true" >> /etc/supervisor/conf.d/supervisord.conf

RUN echo "[program:nextjs]" >> /etc/supervisor/conf.d/supervisord.conf
RUN echo "command=./start.sh" >> /etc/supervisor/conf.d/supervisord.conf
RUN echo "directory=/app" >> /etc/supervisor/conf.d/supervisord.conf
RUN echo "autostart=true" >> /etc/supervisor/conf.d/supervisord.conf
RUN echo "autorestart=true" >> /etc/supervisor/conf.d/supervisord.conf

EXPOSE 3000
CMD ["supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
