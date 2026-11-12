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

// El feed solo se puede leer con un token válido: si no hay sesión, responde 401.
postsrouter.get('/feed', isAuth, feed)

export default postsrouter;