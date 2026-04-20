const API_BASE_URL = 'http://localhost:3000';

export function getAvatarUrl(avatar: string | null | undefined): string {
  if (!avatar) return '';
  if (avatar.startsWith('http')) return avatar;
  return `${API_BASE_URL}${avatar}`;
}