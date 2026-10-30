import bcrypt from 'bcrypt';
import db from '../database/database.js';

export const logout = (req, res) => {
    res.clearCookie('username');
    res.redirect('/auth/login');
};

export const register = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        
        // Comprobar si ya existe el usuario o email
        const checkUser = await db.query(
            'SELECT * FROM users WHERE username = $1 OR email = $2',
            [username, email]
        );

        if (checkUser.rows.length > 0) {
            return res.status(400).send('El usuario o email ya está en la base de datos');
        }

        // Hashear contraseña
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Guardar el usuario en la base de datos
        await db.query(
            'INSERT INTO users (username, email, password) VALUES ($1, $2, $3)',
            [username, email, hashedPassword]
        );

        // Cookie de sesión 
        res.cookie('username', username, { maxAge: 900000, httpOnly: true });

        res.send('Bien registrado');
        console.log(`Username: ${username}, Email: ${email}`);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al registrar el usuario');
    }
};

export const login = async (req, res) => {
    try {
        const { username, password } = req.body;
        
        const userResult = await db.query(
            'SELECT * FROM users WHERE username = $1',
            [username]
        );
        const user = userResult.rows[0];

        if (user && await bcrypt.compare(password, user.password)) {
            res.cookie('username', username, { maxAge: 900000, httpOnly: true });
            return res.send('Logueado correctamente');
        }

        res.status(401).send('Credenciales incorrectas');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al iniciar sesión');
    }
};