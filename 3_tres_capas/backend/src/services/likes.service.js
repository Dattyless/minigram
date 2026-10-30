import db from '../database/database.js';

export const doIlike = async (req, res) => {
    try {
        const userResult = await db.query(
            'SELECT id FROM users WHERE username = $1',
            [req.cookies.username]
        );
        const user = userResult.rows[0];
        
        if (!user) return res.redirect('/auth/login');

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

export const switchLike = async (req, res) => {
    try {
        const userResult = await db.query(
            'SELECT id FROM users WHERE username = $1',
            [req.cookies.username]
        );
        const user = userResult.rows[0];
        
        if (!user) return res.redirect('/auth/login');

        const likePostResult = await db.query(
            'SELECT * FROM likes WHERE user_id = $1 AND post_id = $2',
            [user.id, req.params.postId]
        );

        if (likePostResult.rows.length > 0) {
            await db.query(
                'DELETE FROM likes WHERE user_id = $1 AND post_id = $2',
                [user.id, req.params.postId]
            );
        } else {
            await db.query(
                'INSERT INTO likes (user_id, post_id) VALUES ($1, $2)',
                [user.id, req.params.postId]
            );
        }

        res.redirect('/posts/feed');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al alternar like');
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