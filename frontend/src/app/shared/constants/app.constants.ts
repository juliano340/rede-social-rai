export * from './api.constants';
export * from './validation.constants';
export * from './ui.constants';

export const APP_CONSTANTS = {
  // Post limits
  MAX_POST_LENGTH: 280,
  MAX_REPLY_LENGTH: 280,

  // Feed pagination
  DEFAULT_FEED_LIMIT: 20,
  MAX_FEED_LIMIT: 50,
  DEFAULT_REPLIES_LIMIT: 20,
  MAX_REPLIES_LIMIT: 50,

  // Feed replies included in initial load
  FEED_TOP_REPLIES_LIMIT: 3,
  FEED_NESTED_REPLIES_LIMIT: 2,

  // Replies pagination
  REPLIES_CHILDREN_LIMIT: 10,
  REPLIES_GRANDCHILDREN_LIMIT: 5,

  // Rate limits (frontend display values, should match backend)
  MAX_POSTS_PER_MINUTE: 2,
  MAX_LIKES_PER_MINUTE: 30,
  MAX_REPLIES_PER_MINUTE: 2,
  MAX_REPLIES_PER_DAY: 1000,

  // Cache
  CACHE_TTL_MS: 30 * 1000, // 30 seconds

  // Timeouts
  HIGHLIGHT_FADE_DURATION_MS: 3000,
  TOAST_DURATION_MS: 3000,
  RETRY_DELAY_MS: 1000,

  // Media
  MAX_IMAGE_SIZE_MB: 5,
  SUPPORTED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],

  // UI
  SKELETON_POST_COUNT: 5,
  AVATAR_SIZE_PX: 48,
  AVATAR_SIZE_SMALL_PX: 32,
  AVATAR_SIZE_XSMALL_PX: 24,
} as const;

export const HTTP_STATUS = {
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

export const ERROR_MESSAGES = {
  [HTTP_STATUS.UNAUTHORIZED]: 'Sua sessão expirou. Faça login novamente.',
  [HTTP_STATUS.FORBIDDEN]: 'Você não tem permissão para realizar esta ação.',
  [HTTP_STATUS.NOT_FOUND]: 'Conteúdo não encontrado.',
  [HTTP_STATUS.TOO_MANY_REQUESTS]: 'Você está realizando muitas ações. Aguarde um momento.',
  [HTTP_STATUS.INTERNAL_SERVER_ERROR]: 'Erro interno do servidor. Tente novamente mais tarde.',
  DEFAULT: 'Ocorreu um erro. Tente novamente.',
} as const;
