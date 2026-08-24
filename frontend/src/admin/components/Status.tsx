import { memo } from 'react';

export const Status = memo(function Status({ value }: { value: string }) {
  return <span className={`status status-${value.toLowerCase()}`}>{value}</span>;
});
