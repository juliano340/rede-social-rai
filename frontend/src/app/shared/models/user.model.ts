export interface User {
  id: string;
  username: string;
  email?: string;
  name: string;
  bio?: string | null;
  bioLink?: string | null;
  avatar?: string | null;
  createdAt?: string;
  _count?: {
    posts: number;
    followers: number;
    following: number;
  };
  isFollowing?: boolean;
}

export interface UserProfile extends User {
  id: string;
  username: string;
  name: string;
  bio: string | null;
  bioLink: string | null;
  avatar: string | null;
  createdAt: string;
  _count: {
    posts: number;
    followers: number;
    following: number;
  };
  isFollowing?: boolean;
}

export interface AuthResponse {
  id: string;
  username: string;
  email: string;
  name: string;
}

export interface UsersResponse {
  users: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
