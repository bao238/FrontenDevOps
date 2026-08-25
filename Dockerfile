# Stage 1: Build
FROM node:18-alpine AS builder
WORKDIR /app

# Cài đặt dependencies
COPY package*.json ./
RUN npm install

# Copy source code và build ứng dụng
COPY . .
RUN npm run build

# Stage 2: Run
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy các artifacts cần thiết từ builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["npm", "start"]
