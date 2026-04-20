export interface Post {
  id: string;
  content: string;
  mediaUrl?: string | null;
  mediaType?: 'image' | 'youtube' | null;
  linkUrl?: string | null;
  createdAt: string;
  author: {
    id: string;
    username: string;
    name: string;
    avatar: string | null;
  };
  _count: {
    likes: number;
    replies: number;
  };
}

export interface PostsResponse {
  posts: Post[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface Reply {
  id: string;
  content: string;
  createdAt?: string;
  author: {
    id: string;
    username: string;
    name: string;
    avatar: string | null;
  };
  children?: Reply[];
}

export interface RepliesResponse {
  replies: Reply[];
  nextCursor?: string | null;
  hasMore?: boolean;
}
