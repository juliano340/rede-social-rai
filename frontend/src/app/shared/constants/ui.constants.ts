export const UI_THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
} as const;

export const UI_Z_INDEX = {
  MODAL: 1000,
  TOAST: 1100,
  DROPDOWN: 900,
  TOOLTIP: 800,
} as const;

export const UI_SIZES = {
  AVATAR: {
    XL: 48,
    LG: 40,
    MD: 32,
    SM: 24,
  },
  ICON: {
    MD: 20,
    SM: 16,
  },
} as const;

export const UI_ANIMATION = {
  FAST_MS: 150,
  NORMAL_MS: 300,
  SLOW_MS: 500,
} as const;

export const UI_FORM = {
  INPUT_PADDING: '12px 14px 12px 42px',
  INPUT_ICON_LEFT: '14px',
  BORDER_RADIUS: 'var(--radius-md)',
} as const;

export const UI_BUTTON = {
  PADDING: '14px 24px',
  BORDER_RADIUS: 'var(--radius-full)',
  FONT_WEIGHT: 600,
} as const;

export const UI_CARD = {
  MAX_WIDTH: '400px',
  PADDING: '32px',
  BORDER_RADIUS: 'var(--radius-lg)',
} as const;