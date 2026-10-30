
import { Pool } from 'pg';

const db = new Pool({
    host: process.env.DB_HOST || 'bbdd',
    port: Number(process.env.DB_PORT || 5432),
    database: process.env.DB_NAME || 'monolito',
    user: process.env.DB_USER || 'usuario',
    password: process.env.DB_PASSWORD || '123456',
});

export default db;
