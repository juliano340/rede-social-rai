import { environment } from '../../../environments/environment';

export function getAvatarUrl(avatar: string | null | undefined): string {
  if (!avatar) return '';
  if (avatar.startsWith('http')) return avatar;
  return `${environment.apiUrl}${avatar}`;
}