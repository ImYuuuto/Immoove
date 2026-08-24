import { AppError } from '../../src/utils/errorHandler';
import {
  sanitizeOptionalText,
  sanitizeRequiredText,
  sanitizeText,
} from '../../src/utils/sanitize';

describe('stored text sanitization', () => {
  test('strips executable tags, attributes, and their script content', () => {
    expect(
      sanitizeText(
        '<script>alert(1)</script><b onclick="steal()">Safe text</b>',
      ),
    ).toBe('Safe text');
  });

  test('HTML-encodes unsafe text entities', () => {
    expect(sanitizeText('Fish & chips > everything')).toBe(
      'Fish &amp; chips &gt; everything',
    );
  });

  test('rejects required values containing only discarded markup', () => {
    expect(() =>
      sanitizeRequiredText('<script>bad()</script>', 'title'),
    ).toThrow(AppError);
  });

  test('preserves missing optional values', () => {
    expect(sanitizeOptionalText()).toBeUndefined();
  });
});
