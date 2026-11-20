FROM node:24.21-alpine3.24

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

RUN npm install -g serve

EXPOSE 4200

# "-s" hace fallback a index.html para que rutas como /login funcionen al recargar.
CMD ["serve", "-s", "dist/frontend/browser", "-l", "4200"]
