import { memo } from 'react';
import { useAdminCopy } from '../adminI18n';
import { roleLabel } from '../../i18n/labels';
import { useLanguage } from '../../i18n/language';

export const Status = memo(function Status({ value }: { value: string }) {
  const copy = useAdminCopy();
  const { language } = useLanguage();
  const normalized = value.toLowerCase();
  const label =
    normalized === 'approved'
      ? copy.approved
      : normalized === 'rejected'
        ? copy.rejected
        : normalized === 'pending'
          ? copy.pendingStatus
          : ['CLIENT', 'ADMIN'].includes(value)
            ? roleLabel(value, language)
            : value;
  return <span className={`status status-${normalized}`}>{label}</span>;
});
