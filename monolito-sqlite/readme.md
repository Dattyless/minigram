# minigram — Backend (monolito SQLite)

Red social tipo Instagram a la que le llamo **minigram**. Es un **monolito**: un solo proceso Node/Express que sirve las vistas (EJS), la API y guarda todo en **SQLite**.

- **Node** 24 + **Express 5** (ESM, `"type": "module"`)
- **EJS** como motor de vistas (server-side rendering)
- **SQLite** vía `better-sqlite3` (síncrono, sin servidor)
- **bcrypt** para hash de contraseñas
- **multer** para subida de imágenes
- **cookie-parser** + cookies `httpOnly` para la sesión
- **Docker / Docker Compose** para desplegar dos instancias

---

## Arranque rápido (sin Docker)

```bash
npm install        # instalar dependencias
npm run dev        # desarrollo con nodemon (recarga automática)
npm start          # producción: node src/server.js
```

El servidor levanta en **http://localhost:3000**.

> El primer log que verás en consola: `Example app listening on port http://localhost:3000`

---

## Base de datos (SQLite)

| Archivo | Qué es |
|---|---|
| `src/database/database.js` | Crea la conexión a `minigram.db` y aplica los pragmas |
| `src/database/schema.sql` | Esquema (tablas `users`, `posts`, `comments`, `likes`) |
| `src/database/init.js` | Script que ejecuta el esquema para crear las tablas |
| `minigram.db` | La base de datos (relativa al **cwd**, o sea donde ejecutas `npm start`) |
| `minigram.db-wal` / `-shm` | Archivos del modo WAL (no los borres con el servidor corriendo) |

**Pragmas activos** (en `database.js`):

```js
db.pragma('foreign_keys = ON');  // respeta las FOREIGN KEY
db.pragma('journal_mode = WAL'); // lecturas concurrentes, más rápido
```

### Inicializar la base de datos

```bash
npm run db:init
```

> ⚠️ **Ojo:** `init.js` está escrito con `require()` (CommonJS) pero el proyecto es ESM, así que este script **falla tal cual**. Solución rápida (ver "Cosas a corregir" más abajo): convertirlo a `import`. O en caliente, desde la raíz del proyecto:
>
> ```bash
> node -e "import('./src/database/database.js').then(m => { const fs=require('fs'); m.default.exec(fs.readFileSync('src/database/schema.sql','utf8')); console.log('DB inicializada'); })"
> ```

### Consultar la base de datos a mano

Si tienes la CLI de SQLite:

```bash
sqlite3 minigram.db
# dentro de la consola:
.tables                     # ver tablas
.schema posts               # ver estructura de una tabla
SELECT id, username FROM users;
.quit
```

Sin CLI, puedes usar cualquier visor de SQLite (VS Code con extensión, DB Browser for SQLite, etc.).

---

## Docker

### Archivos

- `Dockerfile` → imagen basada en `node:24.21-alpine3.24`. Instala `python3 make g++` (necesarios para compilar `better-sqlite3`/`bcrypt`), luego `npm ci`.
- `docker-compose.yaml` → **2 servicios**:
  - `monolito`  → usa la imagen etiquetada `monolito:1` (puerto **3000**)
  - `monolito2` → se compila desde el `Dockerfile` (puerto **3001** → 3000 interno)

### ⚠️ El error clásico: `pull access denied for monolito`

El servicio `monolito` solo tiene `image: monolito:1`. Docker intenta **bajar** esa imagen de Docker Hub porque no existe localmente, y falla.

**Solución 1 — compilar la imagen a mano una vez:**

```bash
docker build -t monolito:1 .
docker compose up
```

**Solución 2 — que compose la compile (recomendada, no toca el build manual):**

```yaml
services:
  monolito:
    build:
      context: .
      dockerfile: Dockerfile
    image: monolito:1        # ← build + image = compilar y etiquetar
    container_name: monolito
    ports:
      - "3000:3000"
```

Luego:

```bash
docker compose up --build
```

### Comandos Docker útiles

```bash
docker build -t monolito:1 .            # crear la imagen y etiquetarla como monolito:1
docker images                           # comprobar que la imagen existe (¿aparece monolito:1?)
docker compose up                       # levantar todo
docker compose up --build               # reconstruir y levantar
docker compose up -d                    # levantar en background
docker compose down                     # parar y borrar contenedores
docker compose down --volumes           # parar borrando también volúmenes
docker compose logs -f                  # ver logs en vivo
docker compose ps                       # estado de los servicios
docker exec -it monolito sh             # entrar a un contenedor (alpine usa sh, no bash)
docker ps                               # contenedores en marcha
```

**Ruta alternativa sin compose:**

```bash
docker run -p 3000:3000 --name monolito monolito:1
```

### ⚠️ `.dockerignore` está vacío

Como `Dockerfile` hace `COPY . .` y no hay `.dockerignore`, la imagen se lleva **`node_modules/` de tu host** (que además es de Windows, y en Alpine Linux puede romper los binarios nativos), la `.db` y los `uploads/`. Recomendado:

```
node_modules
npm-debug.log
*.db
*.db-wal
*.db-shm
uploads
.git
```

---

## Arquitectura de carpetas

```
src/
├── server.js              # punto de entrada: monta middlewares + routers
├── database/
│   ├── database.js        # conexión SQLite (better-sqlite3)
│   ├── schema.sql         # DDL de las tablas
│   └── init.js            # crea las tablas
├── middlewares/
│   ├── auth.js            # isAuth + addUserToLocals
│   └── upload.js          # config de multer (carpeta uploads/ + UUID)
├── routers/               # declaran las rutas y las protegen con isAuth
│   ├── main.route.js      # raíz
│   ├── auth.route.js      # login / register / logout
│   ├── post.router.js     # crear, feed, borrar posts
│   ├── like.route.js      # likes
│   └── comment.route.js   # comentarios
├── services/              # la lógica (queries SQL + respuesta)
│   ├── auth.service.js
│   ├── posts.service.js   # createPost
│   ├── post.service.js    # feed, deletePost
│   ├── likes.service.js
│   └── comments.service.js
└── views/                 # plantillas EJS
    ├── index.ejs
    ├── auth/ (login, register)
    └── posts/ (create-post, feed, post/)
uploads/                   # imágenes subidas (estáticas en /uploads)
```

**Patrón seguido:** el *router* define la URL y aplica `isAuth` + `upload`; el *service* contiene la lógica y el SQL. Si añades endpoint nuevo → lógica en `services/`, ruta en `routers/`.

---

## Middlewares importantes

| Middleware | Archivo | Qué hace |
|---|---|---|
| `isAuth` | `middlewares/auth.js` | Si **no** hay cookie `username` → `redirect('/auth/login')`. Si hay → `next()` |
| `addUserToLocals` | `middlewares/auth.js` | Copia `req.cookies.username` a `res.locals.user` para que las vistas sepan quién es el usuario |
| `upload.single('image')` | `middlewares/upload.js` | multer con `diskStorage`: guarda en `uploads/` con nombre **UUID + extensión original** |

### Sesión con cookies (no JWT)

La "sesión" es simplemente una cookie llamada **`username`**:

```js
res.cookie('username', username, { maxAge: 900000, httpOnly: true });
```

- `maxAge: 900000` → **15 minutos**
- `httpOnly: true` → no es accesible desde JS del navegador
- No hay tokens ni sesiones en servidor: **si tienes la cookie, estás logueado**
- Logout: `res.clearCookie('username')`

Para probar rutas protegidas con `curl`:

```bash
# 1) login (guarda la cookie)
curl -c cookies.txt -X POST http://localhost:3000/auth/login \
     -d "username=ana&password=secreto"

# 2) usarla en una ruta protegida
curl -b cookies.txt http://localhost:3000/post/feed
```

---

## Rutas de la API

### Principales (`/`)

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/` | – | Página de inicio (render `index`) |
| GET | `/protected` | ✅ | Ejemplo de ruta protegida |

### Auth (`/auth`)

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/auth/register` | Formulario de registro |
| POST | `/auth/register` | Crea usuario (hash bcrypt, 10 rounds) y pone cookie |
| GET | `/auth/login` | Formulario de login |
| POST | `/auth/login` | Valida credenciales y pone cookie |
| GET | `/auth/logout` | Borra la cookie |

### Posts (`/post`)

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/post/create-post` | ✅ | Formulario de creación |
| POST | `/post/create-post` | ✅ | Crea post. Campo `image` (multipart) + `caption` |
| GET | `/post/feed` | ✅ | Feed con los últimos 20 posts |
| GET | `/post/delete-post/:id` | ✅ | Borra post (solo si eres el dueño) |

### Likes (`/like`)

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/like/count/:postId` | ✅ | `{"count": N}` |
| GET | `/like/switch-like/:postId` | ✅ | Alterna like (dar/quitar) |
| GET | `/like/doILike/:postId` | ✅ | `{"liked": true/false}` |

### Comentarios (`/comment`)

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/comment/list/:postId` | ✅ | Lista comentarios (con flag `isOwner`) |
| POST | `/comment/create-comment/:postId` | ✅ | Crea comentario (`content` en el body) |
| GET | `/comment/delete-comment/:commentId` | ✅ | Borra comentario (solo el dueño) |

### Estáticos

| Ruta | Descripción |
|---|---|
| `/uploads/*` | Sirve las imágenes subidas (`express.static('uploads')`) |

> Nota: los likes y comentarios se manejan con **GET** por encima de REST puro. Funciona, pero lo "correcto" sería POST/DELETE y un token CSRF.

---

## Esquema de la base de datos

```
users          id, username (UNIQUE), email (UNIQUE), password (hash bcrypt),
               avatar_filename, created_at
posts          id, user_id → users.id (ON DELETE CASCADE), caption,
               image_filename, created_at
comments       id, post_id → posts.id (CASCADE), user_id → users.id (CASCADE),
               content, created_at
likes          post_id → posts.id, user_id → users.id, created_at,
               UNIQUE (post_id, user_id)  ← impide likes duplicados
```

**Cosas a recordar sobre el esquema:**

- `image_filename` / `avatar_filename` guardan **solo el nombre del archivo** en `uploads/`, nunca la ruta completa.
- La tabla `likes` no tiene `id`: la clave es la combinación `(post_id, user_id)`.
- Al borrar un post se borran sus likes en una **transacción** (`db.transaction`), y los comentarios caen en cascada por la FK.

---

## Subida de imágenes

```js
// middlewares/upload.js
const storage = multer.diskStorage({
    destination: 'uploads/',
    filename: (req, file, cb) => {
        const extension = path.extname(file.originalname).toLowerCase();
        cb(null, randomUUID() + extension);   // ej: 01920de3-5fc4-...png
    }
});
```

- Se usa `upload.single('image')` → el campo del formulario debe llamarse **`image`**.
- El nombre original se **descarta** y se genera un UUID (evita colisiones y nombres maliciosos).
- La carpeta `uploads/` debe existir antes de arrancar (relativa al cwd).

Ejemplo de subida con `curl`:

```bash
curl -b cookies.txt -X POST http://localhost:3000/post/create-post \
     -F "image=@foto.png" \
     -F "caption=mi primer post"
```

---

## Trucos de desarrollo

```bash
# Ver qué tablas hay
sqlite3 minigram.db ".tables"

# Ver logs del contenedor en vivo
docker compose logs -f monolito

# Entrar al contenedor a inspeccionar
docker exec -it monolito sh

# Probar una ruta protegida sin navegador
curl -b cookies.txt http://localhost:3000/post/feed

# Reiniciar todo de cero
docker compose down && docker compose up --build
```

---

## Cosas a corregir / tener presentes

1. **`npm run db:init` falla**: `init.js` usa `require()` pero el proyecto es ESM. Debería ser:
   ```js
   import fs from 'node:fs';
   import path from 'node:path';
   import { fileURLToPath } from 'node:url';
   import db from './database.js';

   const __dirname = path.dirname(fileURLToPath(import.meta.url));
   const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
   db.exec(schema);
   console.log('Base de datos inicializada correctamente.');
   db.close();
   ```
2. **`COPY . .` sin `.dockerignore`** → la imagen se lleva `node_modules`, la `.db` y `uploads/`. Ver sección Docker.
3. **La DB es relativa al cwd**: si ejecutas `npm start` desde otra carpeta, SQLite creará un `minigram.db` nuevo vacío ahí.
4. **Sin `npm ci` reproducible en dev**: el `Dockerfile` usa `npm ci` (bien), pero recuerda hacer commit del `package-lock.json`.
5. **Cookie de sesión = nombre de usuario en claro**: funciona para el ejercicio, pero en producción se usaría un token/opaco y se guardaría hash de sesión en servidor.
6. **Likes y comentarios vía GET**: considera pasar a POST/DELETE cuando toque.

---

## Resumen de comandos

| Comando | Para qué |
|---|---|
| `npm install` | Instalar dependencias |
| `npm run dev` | Desarrollo con recarga (nodemon) |
| `npm start` | Producción |
| `npm run db:init` | Crear tablas (ver aviso ESM) |
| `docker build -t monolito:1 .` | Crear la imagen local `monolito:1` |
| `docker compose up --build` | Levantar las 2 instancias |
| `docker compose down` | Parar todo |
| `docker exec -it monolito sh` | Entrar al contenedor |
| `sqlite3 minigram.db` | Inspeccionar la base de datos |
