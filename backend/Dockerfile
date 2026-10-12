FROM node:20-alpine

WORKDIR /app

# Copy package.json và cài đặt dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy toàn bộ mã nguồn
COPY . .

EXPOSE 5000

ENV PORT=5000
ENV NODE_ENV=production

CMD ["node", "src/server.js"]
