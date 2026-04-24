import { validatePublicUrl, normalizeBioLinkValue, validateAvatarUrl } from '../src/common/utils/url-validator.util';

describe('URL Validator', () => {
  describe('validatePublicUrl', () => {
    it('should accept valid https URL', () => {
      expect(() => validatePublicUrl('https://example.com/image.jpg')).not.toThrow();
    });

    it('should reject localhost URL', () => {
      expect(() => validatePublicUrl('http://localhost:3000')).toThrow();
    });

    it('should reject private IP URL', () => {
      expect(() => validatePublicUrl('http://192.168.1.1')).toThrow();
    });

    it('should reject non-http protocol', () => {
      expect(() => validatePublicUrl('ftp://example.com')).toThrow();
    });
  });

  describe('normalizeBioLinkValue', () => {
    it('should return null for empty string', () => {
      expect(normalizeBioLinkValue('')).toBeNull();
    });

    it('should return undefined for undefined input', () => {
      expect(normalizeBioLinkValue(undefined)).toBeUndefined();
    });

    it('should return trimmed valid URL', () => {
      expect(normalizeBioLinkValue('https://example.com')).toBe('https://example.com');
    });

    it('should reject private URL', () => {
      expect(() => normalizeBioLinkValue('http://localhost')).toThrow();
    });
  });

  describe('validateAvatarUrl', () => {
    it('should accept valid image URL', () => {
      expect(() => validateAvatarUrl('https://example.com/avatar.jpg')).not.toThrow();
    });

    it('should reject URL without image extension', () => {
      expect(() => validateAvatarUrl('https://example.com/file.pdf')).toThrow();
    });

    it('should accept URL with image query param', () => {
      expect(() => validateAvatarUrl('https://example.com/image?format=png')).not.toThrow();
    });

    it('should reject localhost avatar URL', () => {
      expect(() => validateAvatarUrl('http://localhost:3000/avatar.png')).toThrow();
    });
  });
});
