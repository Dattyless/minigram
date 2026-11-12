import jwt from 'jsonwebtoken';


export const isAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; 
  // Extrae el token del encabezado Authorization.
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  jwt.verify(token, 'your_secret_key', (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    res.locals.user = decoded;
    next();
  });
};
export const addUserToLocals = (req, res, next) => {
  const username = req.cookies.username;
  if (username) {
    res.locals.username = username;
  }
  next();

}

