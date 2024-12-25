# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

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

# Add cron jobs
RUN echo "* * * * * /usr/local/bin/node /app/dist/worker/process-job.js >> /app/logs/process-jobs.log 2>&1" > /etc/crontabs/root
    echo "*/5 * * * * /usr/local/bin/node /app/dist/worker/process-job.js >> /app/logs/process-jobs.log 2>&1" > /etc/crontabs/root
    echo "*/10 * * * * /usr/local/bin/node /app/dist/worker/process-job.js >> /app/logs/process-jobs.log 2>&1" > /etc/crontabs/root

RUN chmod 600 /etc/crontabs/root && chown root:root /etc/crontabs/root

RUN mkdir -p /etc/supervisor/conf.d
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
RUN echo "stdout_logfile=/app/logs/nextjs.log" >> /etc/supervisor/conf.d/supervisord.conf
RUN echo "stderr_logfile=/app/logs/nextjs-error.log" >> /etc/supervisor/conf.d/supervisord.conf

EXPOSE 3000
CMD ["supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
