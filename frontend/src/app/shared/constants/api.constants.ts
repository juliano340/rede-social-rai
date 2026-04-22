export const API_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export const API_URL = {
  DEFAULT: 'http://localhost:3000',
} as const;

export const API_ENDPOINTS = {
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    DELETE_ACCOUNT: '/auth/account',
  },
  POSTS: {
    BASE: '/posts',
    FOLLOWING: '/posts/following',
    USER: (userId: string) => `/posts/user/${userId}`,
    LIKE: (postId: string) => `/posts/${postId}/like`,
    REPLY: (postId: string) => `/posts/${postId}/reply`,
    REPLIES: (postId: string) => `/posts/${postId}/replies`,
    REPLY_BY_ID: (postId: string, replyId: string) => `/posts/${postId}/reply/${replyId}`,
  },
  USERS: {
    BASE: '/users',
    ME: '/users/me',
    FOLLOW: (userId: string) => `/users/${userId}/followers`,
    FOLLOWERS: (userId: string) => `/users/${userId}/followers`,
    FOLLOWING: (userId: string) => `/users/${userId}/following`,
    SEARCH: '/users/search',
    SUGGESTED: '/users/suggested',
    AVATAR_ME: '/users/me/avatar',
    AVATAR_URL_ME: '/users/me/avatar-url',
    BY_USERNAME: (username: string) => `/users/${username}`,
  },
  NOTIFICATIONS: {
    BASE: '/notifications',
    READ: '/notifications/read',
  },
} as const;

export const API_STORAGE_KEYS = {
  USER: 'user',
  THEME: 'rai-theme',
  AUTH_TOKEN: 'auth-token',
  REFRESH_TOKEN: 'refresh-token',
} as const;

export const ROUTES = {
  HOME: '/home',
  PROFILE: (username: string) => `/${username}`,
  LOGIN: '/login',
  REGISTER: '/register',
  SETTINGS: '/settings',
  SEARCH: '/search',
} as const;