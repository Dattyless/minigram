# Minigram --- Backend con arquitectura de dos capas

Minigram es una red social tipo Instagram. El proyecto está organizado
en **dos capas** desplegadas en contenedores separados:

1.  **Capa de aplicación (`backend`)**: Node.js 24 y Express 5. Gestiona
    las rutas, las vistas EJS, la autenticación, las subidas de imágenes
    y la lógica de negocio.
2.  **Capa de datos (`bbdd`)**: PostgreSQL. Guarda los usuarios,
    publicaciones, comentarios y likes.

Docker Compose conecta ambas capas mediante una red privada. El backend
se conecta a PostgreSQL usando el nombre de servicio `bbdd`, no
`localhost`.

## Tecnologías

-   Node.js 24 + Express 5 (ES modules, `"type": "module"`).
-   EJS para renderizar las vistas en el servidor.
-   PostgreSQL como base de datos relacional.
-   `pg` para conectar Node.js con PostgreSQL.
-   `bcrypt` para el hash de contraseñas.
-   `multer` para subir imágenes.
-   `cookie-parser` para leer cookies.
-   Docker y Docker Compose para ejecutar el backend y la base de datos
    por separado.

## Estructura del proyecto

``` text
2_dos-capas/
├── backend/
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── package.json
│   ├── package-lock.json
│   ├── uploads/
│   └── src/
│       ├── server.js
│       ├── database/
│       │   └── database.js
│       ├── middlewares/
│       │   ├── auth.js
│       │   └── upload.js
│       ├── routers/
│       ├── services/
│       └── views/
├── bbdd/
│   └── schema.sql
└── docker-compose.yml
```

La estructura concreta de `routers/`, `services/` y `views/` puede
variar según los archivos que tenga el proyecto.

## Arquitectura de dos capas

``` text
Navegador
   |
   | HTTP :3000
   v
backend (Node.js + Express)
   |
   | PostgreSQL, puerto interno 5432
   v
bbdd (PostgreSQL)
```

-   El puerto `3000` del backend se publica en el ordenador como
    `localhost:3000`.
-   PostgreSQL escucha en el puerto `5432` dentro de la red de Docker.
-   El backend usa `DB_HOST=bbdd`.
-   No es necesario publicar el puerto `5432` al host salvo que se
    quiera acceder a PostgreSQL desde una herramienta externa como
    pgAdmin o un cliente SQL.
-   PostgreSQL no debe instalarse ni arrancarse dentro del contenedor
    `backend`.

## `docker-compose.yml`

Este ejemplo corresponde a los nombres de servicios y variables
utilizados en el proyecto:

``` yaml
services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: backend
    ports:
      - "3000:3000"
    environment:
      DB_HOST: bbdd
      DB_PORT: 5432
      DB_NAME: monolito
      DB_USER: usuario
      DB_PASSWORD: "123456"
    networks:
      - dos_capas_network
    depends_on:
      bbdd:
        condition: service_healthy

  bbdd:
    image: postgres:18.6-alpine3.24
    container_name: bbdd
    environment:
      POSTGRES_USER: usuario
      POSTGRES_PASSWORD: "123456"
      POSTGRES_DB: monolito
    volumes:
      - ./bbdd/schema.sql:/docker-entrypoint-initdb.d/schema.sql:ro
    networks:
      - dos_capas_network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U usuario -d monolito"]
      interval: 5s
      timeout: 5s
      retries: 10
      start_period: 10s

networks:
  dos_capas_network:
    driver: bridge
```

> **Nota:** `depends_on` con `condition: service_healthy` hace que
> Compose espere a que PostgreSQL acepte conexiones antes de iniciar el
> backend. Esto no sustituye el manejo de errores de conexión en la
> aplicación.

## Dockerfile del backend

Guarda este archivo como `backend/Dockerfile`:

``` dockerfile
FROM node:24.21-alpine3.24

WORKDIR /app

RUN apk add --no-cache python3 make g++

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

RUN mkdir -p uploads

EXPOSE 3000

CMD ["npm", "start"]
```

Este contenedor ejecuta únicamente Node.js. No instala PostgreSQL ni
ejecuta `initdb` o `pg_ctl`: el servidor de base de datos vive en el
servicio `bbdd`.

El `package.json` debe incluir un script `start` que arranque el
servidor, por ejemplo:

``` json
"scripts": {
  "dev": "nodemon src/server.js --ext js,ejs --ignore node_modules/",
  "start": "node src/server.js"
}
```

Si se ha eliminado `src/database/init.js`, elimina también el script
`"db:init"` del `package.json` y no ejecutes `npm run db:init` desde el
Dockerfile.

## Conexión de PostgreSQL: `src/database/database.js`

El backend debe utilizar las variables definidas en Compose. Por
ejemplo:

``` javascript
import { Pool } from 'pg';

const db = new Pool({
  host: process.env.DB_HOST || 'bbdd',
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME || 'monolito',
  user: process.env.DB_USER || 'usuario',
  password: process.env.DB_PASSWORD || '123456'
});

export default db;
```

Puntos importantes:

-   Usa `DB_NAME`, no `NAME`, porque esa es la variable configurada en
    Compose.
-   Usa `bbdd` como host dentro de Docker; `localhost` apunta al propio
    contenedor del backend.
-   La base de datos configurada aquí debe coincidir con `POSTGRES_DB`
    en el servicio `bbdd`.
-   Reutiliza este `Pool` compartido desde los servicios de la
    aplicación, en lugar de crear pools distintos en cada archivo.
-   En producción, guarda las credenciales en variables de entorno o
    secretos y no uses contraseñas de ejemplo.

## Inicialización del esquema

El archivo `bbdd/schema.sql` se monta en
`/docker-entrypoint-initdb.d/schema.sql`. La imagen oficial de
PostgreSQL ejecuta los scripts de esa carpeta **solo cuando inicializa
un directorio de datos vacío por primera vez**.

Por tanto:

-   Comprueba que `bbdd/schema.sql` contiene las tablas y restricciones
    que necesita la aplicación.
-   Si el contenedor ya tiene un volumen/directorio de datos
    inicializado, editar `schema.sql` no vuelve a ejecutar el archivo
    automáticamente.
-   No elimines volúmenes con `docker compose down -v` salvo que quieras
    borrar los datos de la base de datos.
-   El servicio `backend` no debe arrancar un servidor PostgreSQL propio
    ni intentar crear una base de datos local.

Tablas que la aplicación puede necesitar, según el esquema del proyecto:

-   `users`: usuarios y hashes de contraseñas.
-   `posts`: publicaciones vinculadas a usuarios.
-   `comments`: comentarios vinculados a publicaciones y usuarios.
-   `likes`: relaciones entre usuarios y publicaciones, con una
    restricción única para evitar likes duplicados.

Confirma los nombres, columnas y restricciones reales en
`bbdd/schema.sql`; no se deben dar por creadas tablas que no estén
definidas ahí.

## Dockerignore

Crea `backend/.dockerignore` para evitar copiar dependencias y archivos
locales innecesarios a la imagen:

``` text
node_modules
npm-debug.log
.git
.env
uploads
```

Si las imágenes subidas deben conservarse al recrear contenedores,
configura un volumen específico para `uploads` en Compose. El
`.dockerignore` evita incluir los archivos locales en la imagen, pero no
configura persistencia por sí solo.

## Comandos habituales

Ejecuta los comandos desde la carpeta `2_dos-capas`, donde está
`docker-compose.yml`.

### Validar la configuración

``` bash
docker compose config
```

### Construir y arrancar los servicios

``` bash
docker compose up -d --build
```

### Consultar el estado

``` bash
docker compose ps
```

### Ver los registros

``` bash
docker compose logs -f backend
docker compose logs -f bbdd
```

### Comprobar que PostgreSQL acepta conexiones

``` bash
docker compose exec bbdd pg_isready -U usuario -d monolito
```

La respuesta esperada es similar a:

``` text
/var/run/postgresql:5432 - accepting connections
```

### Abrir una consola SQL

``` bash
docker compose exec bbdd psql -U usuario -d monolito
```

Dentro de `psql`, puedes listar las tablas con:

``` sql
\dt
```

### Reiniciar solo el backend

``` bash
docker compose up -d --build --force-recreate backend
```

### Detener los servicios

``` bash
docker compose down
```

Este comando elimina los contenedores, pero no borra automáticamente los
datos persistentes almacenados en un volumen nombrado.

## Solución de problemas

### `failed to read dockerfile: open Dockerfile: no such file or directory`

Comprueba que exista `backend/Dockerfile` y que Compose tenga:

``` yaml
build:
  context: ./backend
  dockerfile: Dockerfile
```

### `ECONNREFUSED ...:5432`

PostgreSQL todavía no acepta conexiones, el host o el puerto son
incorrectos, o el backend no está en la misma red. Comprueba:

``` bash
docker compose ps
docker compose logs bbdd
docker compose exec bbdd pg_isready -U usuario -d monolito
```

Usa `DB_HOST=bbdd`, no `localhost`, en el contenedor del backend.

### `database "monolito_pgadmin" does not exist`

Algún archivo sigue usando el nombre antiguo. Busca en el proyecto
`monolito_pgadmin` y revisa especialmente `src/database/database.js`. La
configuración debe usar `process.env.DB_NAME || 'monolito'`. Después
reconstruye el backend:

``` bash
docker compose up -d --build --force-recreate backend
```

### PostgreSQL acepta conexiones, pero faltan tablas

Comprueba `bbdd/schema.sql` y lista las tablas con:

``` bash
docker compose exec bbdd psql -U usuario -d monolito -c "\dt"
```

Recuerda que los scripts de `/docker-entrypoint-initdb.d/` solo se
ejecutan en la inicialización inicial de un directorio de datos vacío.

## Organización del código

Mantén la separación de responsabilidades dentro del backend:

-   **Routers:** declaran las URL y los middlewares que necesita cada
    ruta.
-   **Services:** contienen la lógica de negocio y las consultas a la
    base de datos.
-   **Middlewares:** gestionan tareas transversales como autenticación y
    subida de archivos.
-   **Views:** contienen las plantillas EJS.
-   **Database:** centraliza el pool de conexión PostgreSQL.

Aunque el despliegue tiene dos capas, el backend sigue siendo una
aplicación Node/Express que puede contener routers, servicios y vistas.
La separación en dos capas se refiere a la aplicación y la base de datos
en servicios/contenedores diferentes, no a que cada carpeta sea un
contenedor.

## Resumen

-   `backend`: Node.js + Express, puerto `3000`.
-   `bbdd`: PostgreSQL, puerto interno `5432`.
-   Base de datos: `monolito`.
-   Usuario: `usuario`.
-   Host de PostgreSQL desde el backend: `bbdd`.
-   Esquema SQL: `bbdd/schema.sql`.
-   Arranque: `docker compose up -d --build`.
