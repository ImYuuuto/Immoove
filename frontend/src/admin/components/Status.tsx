import { memo } from 'react';
import { useAdminCopy } from '../adminI18n';

export const Status = memo(function Status({ value }: { value: string }) {
  const copy = useAdminCopy();
  const normalized = value.toLowerCase();
  const label = normalized === 'approved' ? copy.approved : normalized === 'rejected' ? copy.rejected : normalized === 'pending' ? copy.pendingStatus : normalized === 'moderator' ? copy.moderator : normalized === 'admin' ? copy.admin : normalized === 'user' ? copy.user : value;
  return <span className={`status status-${normalized}`}>{label}</span>;
});
