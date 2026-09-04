import { Check } from 'lucide-react';
import type { Announcement } from '../../types';
import { formatDate } from '../../utils';
import { decodeText } from '../../../utils/decodeText';
import { Status } from '../Status';
import { useAdminCopy } from '../../adminI18n';

export function AnnouncementsView({
  items,
  onApprove,
}: {
  items: Announcement[];
  onApprove: (id: number) => void;
}) {
  const copy = useAdminCopy();
  return (
    <section className="admin-content">
      <div className="request-grid">
        {items.map((item) => (
          <article className="request-card" key={item.request_id}>
            <div className="request-top">
              <Status value={item.status} />
              <small>#{item.request_id}</small>
            </div>
            <h2>{decodeText(item.title)}</h2>
            <p>{decodeText(item.description) || copy.noDescription}</p>
            <address>{decodeText(item.address)}</address>
            <small className="request-date">
              {copy.receivedOn} {formatDate(item.created_at)}
            </small>
            {item.status === 'ESCALATED' && (
              <div className="request-actions">
                <button className="approve" onClick={() => onApprove(item.request_id)}>
                  <Check size={15} />
                  {copy.approve}
                </button>
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
