import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

export function getYouTubeEmbedUrl(url: string, sanitizer: DomSanitizer): SafeResourceUrl | null {
  if (!url) return null;
  const match = url.match(/(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]+)/);
  if (!match) return null;
  const embedUrl = `https://www.youtube.com/embed/${match[2]}`;
  return sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
}

export function isValidImageUrl(url: string): boolean {
  if (!url) return false;
  return /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
}

export function normalizeUrl(url: string): string | null {
  if (!url) return null;
  url = url.trim();
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return 'https://' + url;
  }
  return url;
}

export function detectUrlInContent(content: string): string | null {
  const match = content.match(/(https?:\/\/[^\s<>"{}|\\^`[\]]+)/);
  return match ? match[1] : null;
}

export function getDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}