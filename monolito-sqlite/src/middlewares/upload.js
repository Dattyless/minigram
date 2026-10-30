import multer from 'multer';
import {randomUUID} from 'crypto';
import path from 'path';


export const storage = multer.diskStorage({
  destination: 'uploads/', 
   filename: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    cb(null, `${randomUUID()}${extension}`);
  }
})


export const upload = multer({ storage }); //carpeta donde se guardaran las imagnes