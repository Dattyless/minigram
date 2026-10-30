import express from 'express';
import { isAuth } from '../middlewares/auth.js';
import { logout } from '../services/auth.service.js';
import { register, login } from '../services/auth.service.js';

const authrouter = express.Router()

authrouter.get('/logout', (req, res) => {
    res.clearCookie('username');
    res.redirect('/auth/login');
});

authrouter.get('/register', (req, res) => {
    res.render('auth/register')
})

authrouter.get('/login', (req, res) => {
    res.render('auth/login')
})

authrouter.post('/login', login);

authrouter.post('/register', register);

export default authrouter;