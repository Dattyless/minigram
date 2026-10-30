import db from '../database/database.js';

export const createPost = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send('Selecciona una imagen');
        }

        const { caption } = req.body;
        const username = req.cookies.username;

        // Consultamos el user_id del usuario que está creando el post
        const userResult = await db.query(
            'SELECT id FROM users WHERE username = $1',
            [username]
        );
        const user = userResult.rows[0];

        if (!user) {
            return res.status(401).send('Usuario no encontrado');
        }

        // Guardamos el post en la base de datos
        await db.query(
            'INSERT INTO posts (user_id, caption, image_filename) VALUES ($1, $2, $3)',
            [user.id, caption, req.file.filename]
        );

        res.send('Post creado correctamente');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al crear el post');
    }
};

export const createPost2 = async (req, res) => {
    res.render('posts/create-post');
};

// Para eliminar un post
export const eliminarPost = async (req, res) => {
    try {
        const { id } = req.params;
        const username = req.cookies.username;

        const userResult = await db.query(
            'SELECT id FROM users WHERE username = $1',
            [username]
        );
        const user = userResult.rows[0];

        if (!user) {
            return res.status(401).send('Usuario no encontrado');
        }

        const postResult = await db.query(
            'SELECT * FROM posts WHERE id = $1',
            [id]
        );
        const post = postResult.rows[0];

        if (!post) {
            return res.status(404).send('Post no encontrado');
        }

        // Comprobar que el post pertenece al usuario
        if (post.user_id !== user.id) {
            return res.status(403).send('No puedes borrar este post');
        }

        // Borrar likes asociados
        await db.query('DELETE FROM likes WHERE post_id = $1', [id]);

        // Borrar comentarios asociados
        await db.query('DELETE FROM comments WHERE post_id = $1', [id]);

        // Borrar post
        await db.query('DELETE FROM posts WHERE id = $1', [id]);

        res.redirect('/posts/feed');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al eliminar el post');
    }
};

export const feed = async (req, res) => {
    try {
        const postsResult = await db.query(`
            SELECT posts.id, posts.caption, posts.image_filename, users.username
            FROM posts
            INNER JOIN users ON posts.user_id = users.id
            ORDER BY posts.id DESC LIMIT 20
        `);

        res.render('posts/feed', { posts: postsResult.rows });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al cargar el feed');
    }
};