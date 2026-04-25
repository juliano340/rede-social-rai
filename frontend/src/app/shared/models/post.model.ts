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
  isLiked?: boolean;
  replies?: Reply[];
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
  } | null;
  children?: Reply[];
  _count?: {
    children: number;
  };
}

export interface RepliesResponse {
  replies: Reply[];
  nextCursor?: string | null;
  hasMore?: boolean;
}

export interface SubmitReplyEvent {
  postId: string;
  content: string;
}

export interface ReplyActionEvent {
  replyId: string;
  postId: string;
}

export interface NestedReplyEvent {
  replyId: string;
  postId: string;
  content: string;
}
