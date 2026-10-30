import { Router } from 'express';
import { isAuth } from '../middlewares/auth.js';
import db from '../database/database.js';
import { listComment, createComment, deleteComment} from '../services/comments.service.js'

const commentsRouter = Router();


// CREAR COMENTARIO
commentsRouter.post('/create/:postId', isAuth, createComment )


// LISTAR COMENTARIOS
commentsRouter.get('/list/:postId', isAuth, listComment)


// BORRAR COMENTARIO
commentsRouter.post('/delete/:commentId', isAuth, deleteComment)


export default commentsRouter;