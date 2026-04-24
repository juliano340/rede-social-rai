import { BadRequestException } from '@nestjs/common';
import { isIP } from 'node:net';

function isPrivateHost(host: string): boolean {
  const isLocalhost = host === 'localhost' || host.endsWith('.localhost');
  const isInternalHostname = host.endsWith('.local') || (!host.includes('.') && isIP(host) === 0);
  const isLoopbackIpv4 = /^127\./.test(host);
  const isPrivateIpv4 =
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(host) ||
    /^169\.254\./.test(host) ||
    /^0\./.test(host);
  const isBlockedIpv6 = host === '::1' || /^fe80:/i.test(host) || /^fc/i.test(host) || /^fd/i.test(host);

  return isLocalhost || isInternalHostname || isLoopbackIpv4 || isPrivateIpv4 || isBlockedIpv6;
}

export function validatePublicUrl(url: string, label = 'URL'): void {
  const parsed = new URL(url);

  if (!/^https?:$/.test(parsed.protocol)) {
    throw new BadRequestException(`${label} must use http or https protocol`);
  }

  if (isPrivateHost(parsed.hostname.toLowerCase())) {
    throw new BadRequestException(`${label} cannot point to localhost, private, or internal networks`);
  }
}

export function normalizeBioLinkValue(value?: string): string | null | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== 'string') {
    throw new BadRequestException('Invalid bioLink. Provide a valid public http/https URL.');
  }

  const raw = value.trim();
  if (!raw) return null;

  try {
    validatePublicUrl(raw, 'bioLink');
    return raw;
  } catch (error) {
    if (error instanceof BadRequestException) throw error;
    throw new BadRequestException('Invalid bioLink. Provide a valid public http/https URL.');
  }
}

export function validateAvatarUrl(url: string): void {
  const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

  try {
    validatePublicUrl(url, 'Avatar URL');

    const parsed = new URL(url);
    const path = parsed.pathname.toLowerCase();
    const hasExtension = validExtensions.some(ext => path.endsWith(ext));
    const hasImageQuery = /(\?|&)(jpg|jpeg|png|gif|webp)=/i.test(parsed.search);

    if (!hasExtension && !hasImageQuery) {
      throw new BadRequestException('Avatar URL must point to an image file (jpg, jpeg, png, gif, webp)');
    }
  } catch (error) {
    if (error instanceof BadRequestException) throw error;
    throw new BadRequestException('Invalid avatar URL format');
  }
}
