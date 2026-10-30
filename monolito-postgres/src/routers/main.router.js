import { Router } from 'express';
import express from 'express';
import bcrypt from 'bcrypt';
import db from '../database/database.js';
import cookieParser from 'cookie-parser';
import multer from 'multer';
import { isAuth } from '../middlewares/auth.js';
import { upload } from '../middlewares/upload.js';
import { storage } from '../middlewares/upload.js';
import {randomUUID} from 'crypto'; 
import path from 'path';


const mainrouter = Router()


//Creamos ruta protegida
mainrouter.get('/protected', isAuth, (req, res) => {
  res.send('Ruta protegida');
});

//Raiz
mainrouter.get('/', (req, res) => {
  res.render('index')
})

export default mainrouter;
//registro



