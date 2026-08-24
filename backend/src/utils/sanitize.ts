import { FilterXSS } from 'xss';
import { AppError } from './errorHandler';

const textSanitizer = new FilterXSS({
  whiteList: {},
  stripIgnoreTag: true,
  stripIgnoreTagBody: ['script', 'style'],
});

export function sanitizeText(value: string): string {
  return textSanitizer
    .process(value)
    .replace(/&(?!(?:#\d+|#x[\da-f]+|[a-z][\w]+);)/gi, '&amp;')
    .trim();
}

export function sanitizeRequiredText(value: string, field: string): string {
  const sanitized = sanitizeText(value);
  if (!sanitized) throw new AppError(400, `${field} must contain visible text`);
  return sanitized;
}

export function sanitizeOptionalText(value?: string): string | undefined {
  if (value === undefined) return undefined;
  return sanitizeText(value);
}

export function decodeStoredText(value: string): string {
  return value.replace(
    /&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos);/gi,
    (entity, code: string) => {
      if (code[0] === '#') {
        const radix = code[1]?.toLowerCase() === 'x' ? 16 : 10;
        const number = Number.parseInt(code.slice(radix === 16 ? 2 : 1), radix);
        return Number.isFinite(number) &&
          number >= 0 &&
          number <= 0x10ffff &&
          !(number >= 0xd800 && number <= 0xdfff)
          ? String.fromCodePoint(number)
          : entity;
      }
      return (
        { amp: '&', lt: '<', gt: '>', quot: '"', apos: '\'' } as Record<
          string,
          string
        >
      )[code.toLowerCase()];
    },
  );
}
