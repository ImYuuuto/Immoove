import type { AuditEntry } from '../../types';
import { formatDate } from '../../utils';
import { decodeText } from '../../../utils/decodeText';
import { useAdminExtraCopy } from '../../adminExtraI18n';

export function AuditView({ items }: { items: AuditEntry[] }) {
  const extra = useAdminExtraCopy();
  return (
    <section className="admin-content">
      <div className="table-card">
        <div className="panel-heading">
          <div>
            <h2>{extra.adminActivity}</h2>
            <p>{extra.auditText}</p>
          </div>
        </div>
        <div className="admin-table audit-table">
          <div className="table-row table-head">
            <span>{extra.action}</span>
            <span>{extra.actor}</span>
            <span>{extra.entity}</span>
            <span>{extra.reason}</span>
            <span>{extra.date}</span>
          </div>
          {items.map((item) => (
            <div className="table-row" key={item.id}>
              <span>
                <b>{item.action}</b>
                <small>
                  {extra.event} #{item.id}
                </small>
              </span>
              <span>
                {[item.actor?.firstName, item.actor?.lastName].filter(Boolean).join(' ') ||
                  item.actor?.email ||
                  extra.system}
              </span>
              <span>
                {item.entityType} {item.entityId ? `#${item.entityId}` : ''}
              </span>
              <span>{item.reason || '—'}</span>
              <span>{formatDate(item.createdAt)}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
