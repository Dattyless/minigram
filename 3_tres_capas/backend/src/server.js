import express from 'express';
import bcrypt from 'bcrypt';
import db from './database/database.js';
import cookieParser from 'cookie-parser';
import multer from 'multer';
import {randomUUID} from 'crypto'; 
import path from 'path';
import { addUserToLocals } from './middlewares/auth.js';
import authrouter from './routers/auth.router.js';
import mainrouter from './routers/main.router.js';
import postsrouter from './routers/posts.router.js';
import likesRouter from './routers/likes.router.js';
import commentsRouter from './routers/comments.router.js';
import cors from 'cors';
const app = express()
const port = 3000


app.set('view engine', 'ejs');
app.set('views', './src/views');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(addUserToLocals); 
// Sirvo las imágenes subidas para que el navegador pueda mostrarlas.
app.use('/uploads', express.static('uploads'));

// El frontend corre en otro puerto, así que habilito CORS.
app.use(cors());

app.use('/', mainrouter);
app.use('/auth', authrouter);
app.use('/posts', postsrouter);
app.use('/like', likesRouter);
app.use('/comments', commentsRouter);


app.listen(port, () => {
  console.log(`Example app listening on port http://localhost:${port}`)
})