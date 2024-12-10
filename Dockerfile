# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# ติดตั้ง OpenSSL และ dependencies ที่จำเป็น
RUN apk add --no-cache openssl

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all source files
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build application
RUN npm run build

# Production stage
FROM node:18-alpine AS runner

WORKDIR /app

# ติดตั้ง OpenSSL
RUN apk add --no-cache openssl

# Copy necessary files from builder
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src ./src

# Install production dependencies only
RUN npm ci --only=production

# Copy wait-for-it script
COPY wait-for-it.sh ./
RUN chmod +x wait-for-it.sh

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "run", "start"]