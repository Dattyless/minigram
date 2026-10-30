FROM node:24.21-alpine3.24

WORKDIR /app

RUN apk add --no-cache python3 make g++ postgresql postgresql-contrib su-exec && \
    mkdir -p /run/postgresql /var/lib/postgresql/data && \
    chown -R postgres:postgres /run/postgresql /var/lib/postgresql/data

USER postgres
RUN initdb -D /var/lib/postgresql/data && \
    pg_ctl start -D /var/lib/postgresql/data && \
    psql --command "CREATE USER usuario WITH PASSWORD '123456';" && \
    psql --command "CREATE DATABASE monolito OWNER usuario;" && \
    pg_ctl stop -D /var/lib/postgresql/data

USER root

COPY . .

RUN npm ci

EXPOSE 3000

CMD su - postgres -c "pg_ctl start -D /var/lib/postgresql/data -l /var/lib/postgresql/data/logfile" && npm run db:init && npm start