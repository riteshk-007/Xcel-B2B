# server/Dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

RUN npx prisma generate
RUN npx prisma db push

CMD ["npm", "start"]