# Stage 1: Build React
FROM node:20-alpine AS builder
WORKDIR /app

# Cài đặt dependencies
COPY package*.json ./
RUN npm install

# Copy mã nguồn và build React SPA sang thư mục dist
COPY . .
RUN npm run build

# Stage 2: Run with Nginx on Port 3000
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
