import db from '../database/database.js';

// CREAR COMENTARIO
export const createComment = async (req, res) => {
    try {
        const { postId } = req.params;
        const { comment } = req.body;
        // isAuth deja el usuario del token en res.locals.user.
        const username = res.locals.user?.username;

        if (!comment || !comment.trim()) {
            return res.status(400).json({ message: 'El comentario está vacío' });
        }

        const userResult = await db.query(
            'SELECT id, username, avatar_filename FROM users WHERE username = $1',
            [username]
        );
        const user = userResult.rows[0];

        if (!user) {
            return res.status(401).json({ message: 'Usuario no encontrado' });
        }

        const commentResult = await db.query(`
            INSERT INTO comments (post_id, user_id, content)
            VALUES ($1, $2, $3)
            RETURNING id, post_id, user_id, content, created_at
        `, [postId, user.id, comment.trim()]);

        res.status(201).json({
            ...commentResult.rows[0],
            username: user.username,
            avatar_filename: user.avatar_filename
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al crear el comentario' });
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
                users.username,
                users.avatar_filename
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
        const username = res.locals.user?.username;

        const userResult = await db.query(
            'SELECT id FROM users WHERE username = $1',
            [username]
        );
        const user = userResult.rows[0];

        if (!user) {
            return res.status(401).json({ message: 'Usuario no encontrado' });
        }

        // Solo puede borrar el comentario quien lo escribió.
        const deleteResult = await db.query(`
            DELETE FROM comments
            WHERE id = $1
            AND user_id = $2
            RETURNING id
        `, [commentId, user.id]);

        if (deleteResult.rowCount === 0) {
            return res.status(403).json({ message: 'No puedes borrar este comentario' });
        }

        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al borrar el comentario' });
    }
};