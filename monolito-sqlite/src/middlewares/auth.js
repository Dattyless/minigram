import multer from 'multer';
import {randomUUID} from 'crypto';
import path from 'path';


export const isAuth = (req, res, next) => {
  const username = req.cookies.username;
  if (username) {
    next();
  } else {
    res.redirect('/auth/login');
  }
  }
 export const addUserToLocals = (req, res, next) => {
    const username = req.cookies.username;
    if (username) {
      res.locals.username = username;
    }
    next();

}

