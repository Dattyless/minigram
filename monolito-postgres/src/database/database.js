import { Pool } from 'pg'


const db = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || '5432',
    database: process.env.NAME || 'monolito_pgadmin',
    user: process.env.DB_USER || 'izan_pgadmin',
    password: process.env.DB_PASSWORD || 'a',
})

export default db;