// Forma de un comentario tal y como lo devuelve el backend.
export interface Comment {
  id: number;
  user_id: number;
  content: string;
  username: string;
  avatar_filename: string | null;
  created_at?: string;
}
