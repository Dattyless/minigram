-- 1) Usuarios
INSERT INTO users (username, email, password, avatar_filename)
VALUES
    ('ana',   'ana@minigram.com',   'hash_pass_a', NULL),
    ('luis',  'luis@minigram.com',  'hash_pass_a', NULL),
    ('marta', 'marta@minigram.com', 'hash_pass_a', NULL),
    ('pedro', 'pedro@minigram.com', 'hash_pass_a', NULL)
ON CONFLICT (username) DO NOTHING;

-- 2) Posts
INSERT INTO posts (user_id, caption, image_filename)
SELECT u.id, v.caption, v.image_filename
FROM (
    VALUES
        ('ana',   'Primer día con mi cámara nueva', 'seed-ana.png'),
        ('luis',  'Un paseo por la montaña',       'seed-luis.png'),
        ('marta', 'Café y buenos libros',          'seed-marta.png'),
        ('pedro', 'Atardecer en la playa',         'seed-pedro.png')
) AS v(username, caption, image_filename)
JOIN users u ON u.username = v.username
WHERE NOT EXISTS (
    SELECT 1 FROM posts p WHERE p.caption = v.caption
);

-- 3) Comentarios
INSERT INTO comments (post_id, user_id, content)
SELECT p.id, u.id, v.content
FROM (
    VALUES
        ('Primer día con mi cámara nueva', 'luis',  '¡Qué buena foto!'),
        ('Un paseo por la montaña',        'marta', 'Ese paisaje es increíble.'),
        ('Café y buenos libros',           'ana',   'Me encanta ese libro.'),
        ('Primer día con mi cámara nueva', 'pedro', 'El atardecer se ve genial.')
) AS v(caption, username, content)
JOIN posts p ON p.caption = v.caption
JOIN users u ON u.username = v.username
WHERE NOT EXISTS (
    SELECT 1 FROM comments c
    WHERE c.post_id = p.id
      AND c.user_id = u.id
      AND c.content = v.content
);

-- 4) Likes
INSERT INTO likes (post_id, user_id)
SELECT p.id, u.id
FROM (
    VALUES
        ('Primer día con mi cámara nueva', 'luis'),
        ('Primer día con mi cámara nueva', 'marta'),
        ('Un paseo por la montaña',        'ana'),
        ('Café y buenos libros',           'pedro')
) AS v(caption, username)
JOIN posts p ON p.caption = v.caption
JOIN users u ON u.username = v.username
ON CONFLICT (post_id, user_id) DO NOTHING;
