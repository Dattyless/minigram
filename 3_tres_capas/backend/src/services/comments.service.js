import db from '../database/database.js';

// CREAR COMENTARIO
export const createComment = async (req, res) => {
    try {
        const { postId } = req.params;
        const { comment } = req.body;

        const userResult = await db.query(
            'SELECT id FROM users WHERE username = $1',
            [req.cookies.username]
        );
        const user = userResult.rows[0];

        if (!user) {
            return res.redirect('/auth/login');
        }

        await db.query(`
            INSERT INTO comments (post_id, user_id, content)
            VALUES ($1, $2, $3)
        `, [postId, user.id, comment]);

        res.redirect('/posts/feed');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al crear el comentario');
    }
};

// LISTAR COMENTARIOS
export const listComment = async (req, res) => {
    try {
        const { postId } = req.params;

        const commentsResult = await db.query(`
            SELECT
                comments.id,
                comments.content,
                comments.user_id,
                users.username
            FROM comments
            JOIN users ON comments.user_id = users.id
            WHERE comments.post_id = $1
            ORDER BY comments.created_at ASC
        `, [postId]);

        res.json(commentsResult.rows);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al listar los comentarios');
    }
};

// BORRAR COMENTARIO
export const deleteComment = async (req, res) => {
    try {
        const { commentId } = req.params;

        const userResult = await db.query(
            'SELECT id FROM users WHERE username = $1',
            [req.cookies.username]
        );
        const user = userResult.rows[0];

        if (!user) {
            return res.redirect('/auth/login');
        }

        // Solo puede borrar el comentario quien lo escribió
        await db.query(`
            DELETE FROM comments
            WHERE id = $1
            AND user_id = $2
        `, [commentId, user.id]);

        res.redirect('/posts/feed');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al borrar el comentario');
    }
};