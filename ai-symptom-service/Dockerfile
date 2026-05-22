FROM node:20-alpine
WORKDIR /app

# Install system dependencies BEFORE npm install
RUN apk add --no-cache poppler-utils ffmpeg

COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["node", "src/index.js"]