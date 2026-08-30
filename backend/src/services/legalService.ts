import fs from 'node:fs';
import path from 'node:path';
import { query, transaction } from '../config/db';
import { AppError } from '../utils/errorHandler';

export type LegalLanguage = 'en' | 'fr' | 'ar';
export type LegalDocumentType = 'terms' | 'privacy';

const titles: Record<LegalDocumentType, Record<LegalLanguage, string>> = {
  terms: { en: 'Terms of Use', fr: 'Conditions d\'utilisation', ar: 'شروط الاستخدام' },
  privacy: { en: 'Privacy Policy', fr: 'Politique de confidentialité', ar: 'سياسة الخصوصية' },
};

function documentPath(type: LegalDocumentType, version: string, language: LegalLanguage) {
  return path.resolve(process.cwd(), 'legal', `${type}-v${version}.${language}.md`);
}

export class LegalService {
  static async current(type: LegalDocumentType, requestedLanguage: LegalLanguage) {
    const result = await query<any>(
      `SELECT version,requires_reacceptance,effective_at,published_at
       FROM legal_documents WHERE document_type=$1 AND is_current=true`,
      [type],
    );
    const document = result.rows[0];
    if (!document) throw new AppError(404, 'Legal document not found');
    const requestedPath = documentPath(type, document.version, requestedLanguage);
    const englishPath = documentPath(type, document.version, 'en');
    const language = fs.existsSync(requestedPath) ? requestedLanguage : 'en';
    const filePath = language === requestedLanguage ? requestedPath : englishPath;
    if (!fs.existsSync(filePath)) throw new AppError(503, 'Legal document content is unavailable');
    const content = fs.readFileSync(filePath, 'utf8');
    return {
      type,
      version: document.version,
      title: titles[type][requestedLanguage],
      requestedLanguage,
      language,
      translationAvailable: language === requestedLanguage,
      requiresReacceptance: document.requires_reacceptance,
      effectiveAt: document.effective_at,
      publishedAt: document.published_at,
      isDraft: content.includes('[DATE]') || document.version.includes('draft'),
      content,
    };
  }

  static async acceptTerms(userId: number, language: LegalLanguage) {
    return transaction(async (client) => {
      const current = await client.query<{ version: string }>(
        'SELECT version FROM legal_documents WHERE document_type=\'terms\' AND is_current=true FOR SHARE',
      );
      if (!current.rows[0]) throw new AppError(503, 'Current Terms of Use are unavailable');
      await client.query(
        `INSERT INTO user_legal_consents
         (user_id,document_type,document_version,accepted_language)
         VALUES ($1,'terms',$2,$3)
         ON CONFLICT (user_id,document_type,document_version) DO NOTHING`,
        [userId, current.rows[0].version, language],
      );
      const accepted = await client.query<{ accepted_at: Date }>(
        `SELECT accepted_at FROM user_legal_consents
         WHERE user_id=$1 AND document_type='terms' AND document_version=$2`,
        [userId, current.rows[0].version],
      );
      await client.query(
        'UPDATE users SET terms_accepted_at=$1,terms_version=$2 WHERE user_id=$3',
        [accepted.rows[0].accepted_at, current.rows[0].version, userId],
      );
      return { version: current.rows[0].version, acceptedAt: accepted.rows[0].accepted_at };
    });
  }
}
