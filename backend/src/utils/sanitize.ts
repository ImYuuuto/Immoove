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
