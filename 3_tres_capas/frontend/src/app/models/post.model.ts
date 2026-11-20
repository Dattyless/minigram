// Forma de un post tal y como lo devuelve el backend.
export interface Post {
  id: number;
  caption: string | null;
  image_filename: string;
  username: string;
  avatar_filename?: string | null;
}

// El backend responde { posts: [...] }.
export interface FeedResponse {
  posts: Post[];
}
