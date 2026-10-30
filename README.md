# Minigram

Red social tipo Instagram, desarrollada como proyecto académico de DAW. Permite registrarse, iniciar sesión, publicar fotos, comentar y dar "me gusta".

## Arquitectura de 3 capas

Cada capa se ejecuta en su propio contenedor Docker, y Docker Compose las conecta mediante una red privada.

    Navegador
       |
       v
    frontend (Angular)  ->  backend (Node.js + Express)  ->  bbdd (PostgreSQL)

| Capa | Tecnología | Responsabilidad |
|------|------------|-----------------|
| **frontend** | Angular + TypeScript | Interfaz de usuario |
| **backend** | Node.js 24 + Express 5 | Rutas, autenticación, subida de imágenes y lógica de negocio |
| **bbdd** | PostgreSQL | Usuarios, publicaciones, comentarios y likes |

El backend se conecta a la base de datos usando el nombre del servicio (`bbdd`), no `localhost`.

## Tecnologías

- Angular, TypeScript y JavaScript
- Node.js y Express
- PostgreSQL (librería `pg`)
- `bcrypt` para cifrar contraseñas
- `multer` para subir imágenes
- Docker y Docker Compose

## Estructura

    minigram/
    ├── frontend/
    ├── backend/
    │   ├── Dockerfile
    │   └── src/ (routers, services, middlewares, database)
    ├── bbdd/
    │   └── schema.sql
    └── docker-compose.yml

## Base de datos

Tablas: `users`, `posts`, `comments` y `likes`. El esquema está en `bbdd/schema.sql` y se ejecuta automáticamente la primera vez que arranca el contenedor. Los likes tienen una restricción única para evitar duplicados.

## Cómo ejecutarlo

1. Clona el repositorio.
2. Desde la carpeta raíz, ejecuta:

       docker compose up -d --build

3. Abre [http://localhost:4200] en el navegador.

Otros comandos útiles:

    docker compose ps                    # estado de los servicios
    docker compose logs -f backend       # ver registros del backend
    docker compose down                  # detener los servicios

> Usa `docker compose down -v` solo si quieres borrar también los datos de la base de datos.
