import express from 'express';
import { isAuth } from '../middlewares/auth.js';
import { createPost, eliminarPost, feed, createPost2} from '../services/post.service.js';
import { upload } from '../middlewares/upload.js';
import db from '../database/database.js';

const postsrouter = express.Router()

// Estas rutas siguen protegidas porque crean o borran contenido y necesitan
// saber qué usuario ha iniciado sesión.
postsrouter.get('/create-post', isAuth, createPost2)

postsrouter.post('/create-post', isAuth, upload.single('image'), createPost);

postsrouter.get('/delete-post/:id', isAuth, eliminarPost)

// Dejo el feed sin isAuth porque es una ruta de lectura que consume Angular.
// Antes tenía isAuth y, si no había cookie, el backend redirigía al login;
// el frontend recibía HTML en vez del JSON de los posts y no podía pintarlos.
postsrouter.get('/feed', feed )

export default postsrouter;