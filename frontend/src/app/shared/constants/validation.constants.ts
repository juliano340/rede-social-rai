export const VALIDATION_PATTERNS = {
  USERNAME: /^[a-zA-Z0-9_]+$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
} as const;

export const VALIDATION_LIMITS = {
  NAME: {
    MIN: 1,
    MAX: 25,
    MIN_MESSAGE: 'Mínimo 1 caratter',
    MAX_MESSAGE: 'Máximo 25 caracteres',
  },
  USERNAME: {
    MIN: 3,
    MAX: 20,
    MIN_MESSAGE: 'Mínimo 3 caracteres',
    MAX_MESSAGE: 'Máximo 20 caracteres',
  },
  EMAIL: {
    MAX: 100,
    MAX_MESSAGE: 'Máximo 100 caracteres',
  },
  PASSWORD: {
    MIN: 6,
    MAX: 50,
    MIN_MESSAGE: 'Mínimo 6 caracteres',
    MAX_MESSAGE: 'Máximo 50 caracteres',
  },
  BIO: {
    MAX: 160,
    MAX_MESSAGE: 'Máximo 160 caracteres',
  },
  BIO_LINK: {
    MAX: 100,
    MAX_MESSAGE: 'Máximo 100 caracteres',
  },
} as const;

export const VALIDATION_MESSAGES = {
  REQUIRED: (field: string) => `${field} é obrigatório`,
  INVALID_FORMAT: (field: string) => `${field} inválido`,
  USERNAME_CHARS: 'Apenas letras, números e underscore',
} as const;