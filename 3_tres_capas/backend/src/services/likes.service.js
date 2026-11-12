import db from '../database/database.js';

export const doIlike = async (req, res) => {
    try {
        const userResult = await db.query(
            'SELECT id FROM users WHERE username = $1',
            [res.locals.user?.username]
        );
        const user = userResult.rows[0];

        if (!user) return res.status(401).json({ message: 'Usuario no encontrado' });

        const likePostResult = await db.query(
            'SELECT * FROM likes WHERE user_id = $1 AND post_id = $2',
            [user.id, req.params.postId]
        );

        if (likePostResult.rows.length > 0) {
            res.json({ liked: true });
        } else {
            res.json({ liked: false });
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al comprobar like');
    }
};

// Devuelve si el usuario ha dado like y el total de likes del post.
export const likeStatus = async (req, res) => {
    try {
        const { postId } = req.params;

        const userResult = await db.query(
            'SELECT id FROM users WHERE username = $1',
            [res.locals.user?.username]
        );
        const user = userResult.rows[0];

        if (!user) return res.status(401).json({ message: 'Usuario no encontrado' });

        const likeResult = await db.query(
            'SELECT 1 FROM likes WHERE user_id = $1 AND post_id = $2',
            [user.id, postId]
        );

        const countResult = await db.query(
            'SELECT COUNT(*) AS count FROM likes WHERE post_id = $1',
            [postId]
        );

        res.json({
            liked: likeResult.rows.length > 0,
            count: Number(countResult.rows[0].count)
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al cargar los likes' });
    }
};

// Da o quita el like y devuelve el estado actualizado.
export const switchLike = async (req, res) => {
    try {
        const { postId } = req.params;

        const userResult = await db.query(
            'SELECT id FROM users WHERE username = $1',
            [res.locals.user?.username]
        );
        const user = userResult.rows[0];

        if (!user) return res.status(401).json({ message: 'Usuario no encontrado' });

        const likePostResult = await db.query(
            'SELECT 1 FROM likes WHERE user_id = $1 AND post_id = $2',
            [user.id, postId]
        );

        const liked = likePostResult.rows.length === 0;

        if (liked) {
            await db.query(
                'INSERT INTO likes (user_id, post_id) VALUES ($1, $2)',
                [user.id, postId]
            );
        } else {
            await db.query(
                'DELETE FROM likes WHERE user_id = $1 AND post_id = $2',
                [user.id, postId]
            );
        }

        const countResult = await db.query(
            'SELECT COUNT(*) AS count FROM likes WHERE post_id = $1',
            [postId]
        );

        res.json({ liked, count: Number(countResult.rows[0].count) });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al cambiar el like' });
    }
};

export const countLike = async (req, res) => {
    try {
        const countResult = await db.query(
            'SELECT COUNT(*) as count FROM likes WHERE post_id = $1',
            [req.params.postId]
        );
        const count = countResult.rows[0];
        res.json({ count: count ? Number(count.count) : 0 });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al contar likes');
    }
};