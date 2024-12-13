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

# คอมไพล์เฉพาะไฟล์ process-jobs.ts
RUN npx tsc src/worker/process-job.ts --outDir dist --module commonjs --target es6 --esModuleInterop --skipLibCheck

# Production stage
FROM node:18-alpine
WORKDIR /app

RUN apk add --no-cache ffmpeg openssl bash supervisor curl tzdata cronie coreutils

COPY --from=builder /app/ ./
RUN npm install --production && chmod +x wait-for-it.sh

RUN mkdir -p /app/logs
RUN chown root:root /app/logs

# เพิ่ม DATABASE_URL ในไฟล์ /etc/environment
RUN echo "DATABASE_URL=postgresql://Clustra:123456@db:5432/clustra-db?schema=public" >> /etc/environment
RUN echo "AWS_REGION=ap-southeast-1" >> /etc/environment
RUN echo "AWS_ACCESS_KEY_ID=AKIAWQUOZWE6B7U75K4H" >> /etc/environment
RUN echo "AWS_SECRET_ACCESS_KEY=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" >> /etc/environment
RUN echo "CLOUDFRONT_DISTRIBUTION_ID=E6COYGY4KRPPL" >> /etc/environment
RUN echo "AWS_BUCKET_NAME=clustra-bucket-2" >> /etc/environment


# Cron จะใช้ environment ที่กำหนดไว้ใน /etc/environment
RUN echo "* * * * * . /etc/environment; env >> /app/logs/cron-env.log; /usr/local/bin/node /app/dist/worker/process-job.js >> /app/logs/process-jobs.log 2>&1" > /etc/crontabs/root
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
RUN echo "command=./start.sh >> /app/logs/nextjs.log 2>&1" >> /etc/supervisor/conf.d/supervisord.conf
RUN echo "directory=/app" >> /etc/supervisor/conf.d/supervisord.conf
RUN echo "autostart=true" >> /etc/supervisor/conf.d/supervisord.conf
RUN echo "autorestart=true" >> /etc/supervisor/conf.d/supervisord.conf

EXPOSE 3000
CMD ["supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
