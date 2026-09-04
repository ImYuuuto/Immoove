import { Check, X } from 'lucide-react';
import type { ApprovalCase } from '../../types';
import { formatDate } from '../../utils';
import { decodeText } from '../../../utils/decodeText';
import { Status } from '../Status';
import { useAdminCopy } from '../../adminI18n';

export function ApprovalsView({
  items,
  onDecision,
  onBookingDecision,
  onFinalPublication,
}: {
  items: ApprovalCase[];
  onDecision: (id: number, decision: 'approved' | 'rejected' | 'changes_requested') => void;
  onBookingDecision: (id: number, status: 'processing' | 'confirmed' | 'rejected') => void;
  onFinalPublication: (id: number) => void;
}) {
  const copy = useAdminCopy();
  return (
    <section className="admin-content">
      <div className="table-card">
        <div className="panel-heading">
          <div>
            <h2>{copy.approvals}</h2>
            <p>{copy.approvalsText}</p>
          </div>
        </div>
        <div className="request-grid">
          {items.map((item) => {
            const finalPublication =
              item.entityType === 'announcement' && item.status === 'escalated';
            return (
              <article className="request-card" key={item.caseId}>
                <div className="request-top">
                  <Status value={item.status} />
                  <small>
                    {item.entityType} #{item.entityId}
                  </small>
                </div>
                <h2>{decodeText(item.title)}</h2>
                {item.description && <p>{decodeText(item.description)}</p>}
                <small className="request-date">
                  {copy.receivedOn} {formatDate(item.createdAt)}
                </small>
                <div className="request-actions">
                  {item.entityType === 'booking' ? (
                    <>
                      <button
                        className="approve"
                        onClick={() => onBookingDecision(item.entityId, 'confirmed')}
                      >
                        <Check size={15} /> {copy.approve}
                      </button>
                      <button
                        className="reject"
                        onClick={() => onBookingDecision(item.entityId, 'rejected')}
                      >
                        <X size={15} /> {copy.reject}
                      </button>
                    </>
                  ) : finalPublication ? (
                    <button className="approve" onClick={() => onFinalPublication(item.entityId)}>
                      <Check size={15} /> {copy.finalApproval}
                    </button>
                  ) : (
                    <>
                      <button
                        className="approve"
                        onClick={() => onDecision(item.caseId, 'approved')}
                      >
                        <Check size={15} /> {copy.approve}
                      </button>
                      <button
                        className="reject"
                        onClick={() => onDecision(item.caseId, 'rejected')}
                      >
                        <X size={15} /> {copy.reject}
                      </button>
                    </>
                  )}
                </div>
              </article>
            );
          })}
          {!items.length && <p>{copy.noApprovals}</p>}
        </div>
      </div>
    </section>
  );
}
