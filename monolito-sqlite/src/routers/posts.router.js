import express from 'express';
import { isAuth } from '../middlewares/auth.js';
import { createPost, eliminarPost, feed, createPost2} from '../services/post.service.js';
import { upload } from '../middlewares/upload.js';
import db from '../database/database.js';

const postsrouter = express.Router()

postsrouter.get('/create-post', isAuth, createPost2)

postsrouter.post('/create-post', isAuth, upload.single('image'), createPost);

postsrouter.get('/delete-post/:id', isAuth, eliminarPost)

postsrouter.get('/feed', isAuth, feed )

export default postsrouter;