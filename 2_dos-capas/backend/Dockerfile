FROM node:24.21-alpine3.24

WORKDIR /app

COPY . .

RUN npm ci

EXPOSE 3000

CMD npm start