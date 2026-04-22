import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class UrlUtilsService {
  normalizeUrl(url: string): string | null {
    if (!url) return null;
    url = url.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return 'https://' + url;
    }
    return url;
  }

  isValidImageUrl(url: string): boolean {
    if (!url) return false;
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
  }

  detectUrlInContent(content: string): string | null {
    const match = content.match(/(https?:\/\/[^\s<>"{}|\\^`[\]]+)/);
    return match ? match[1] : null;
  }

  getDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace(/^www\./, '');
    } catch {
      return url;
    }
  }
}
