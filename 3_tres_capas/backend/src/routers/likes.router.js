import { Router } from 'express';
import { isAuth } from '../middlewares/auth.js';
import db from '../database/database.js';
const likesRoute = Router()
import { doIlike, countLike, switchLike, likeStatus } from '../services/likes.service.js'

// Devuelve el estado del like del usuario y el contador.
likesRoute.get('/status/:postId', isAuth, likeStatus)

// Devuelve el contador de likes de un post.
likesRoute.get('/count/:postId', isAuth, countLike)

// Da o quita el like del usuario en un post.
likesRoute.get('/switch-like/:postId', isAuth, switchLike);

// Indica si el usuario ha dado like a un post.
likesRoute.get('/doILike/:postId', isAuth, doIlike);

// Exportamos el router.
export default likesRoute;