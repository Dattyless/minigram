import { Router } from 'express';
import { isAuth } from '../middlewares/auth.js';
import db from '../database/database.js';
const likesRoute = Router()
import { doIlike, countLike, switchLike } from '../services/likes.service.js'
//metodos

//devulve cintador de likes
likesRoute.get('/count/:postId', isAuth, countLike)

//nos permite cargar los likes de un post especifico
likesRoute.get('/switch-like/:postId', isAuth, switchLike);

//nos da si el usuario en especifico a q le ha dado like
likesRoute.get('/doILike/:postId', isAuth, doIlike);



//al dina exoirtamos el router
export default likesRoute;