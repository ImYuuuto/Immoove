import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Check,
  ClipboardCheck,
  Clock3,
  History,
  LogOut,
  Menu,
  ShieldCheck,
  X,
} from 'lucide-react';
import { request } from '../utils/request';
import { decodeText } from '../utils/decodeText';
import type { ModerationCase, ModerationDecision, ModerationMetrics, ModeratorUser } from './types';
import { roleLabel } from '../i18n/labels';
import { useModeratorCopy } from './moderatorI18n';
import { useModerationWorkflowCopy } from './moderationWorkflowI18n';
import '../admin/admin.css';
import '../admin/admin-polish.css';
import './moderator.css';
import ResponsiveImage from '../components/ResponsiveImage';

type View = 'queue' | 'history';
type Decision = 'approved' | 'rejected' | 'changes_requested' | 'escalated';

export default function ModeratorDashboard() {
  const { copy, language } = useModeratorCopy();
  const workflow = useModerationWorkflowCopy();
  const locale = language === 'ar' ? 'ar-MA' : language === 'en' ? 'en-GB' : 'fr-FR';
  const [user, setUser] = useState<ModeratorUser | null>(null);
  const [items, setItems] = useState<ModerationCase[]>([]);
  const [history, setHistory] = useState<ModerationDecision[]>([]);
  const [metrics, setMetrics] = useState<ModerationMetrics | null>(null);
  const [selected, setSelected] = useState<ModerationCase | null>(null);
  const [view, setView] = useState<View>('queue');
  const [scope, setScope] = useState<'all' | 'mine' | 'unassigned'>('all');
  const [note, setNote] = useState('');
  const [reasonCode, setReasonCode] = useState('content_quality');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [mobileNav, setMobileNav] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const session = await request<{ user: ModeratorUser }>('/auth/session');
      if (session.user.role !== 'ADMIN')
        throw new Error(copy.accessRequired);
      const [queue, decisionHistory, performance] = await Promise.all([
        request<{ items: ModerationCase[] }>(`/moderation/queue?scope=${scope}&limit=100`),
        request<{ items: ModerationDecision[] }>('/moderation/history'),
        request<ModerationMetrics>('/moderation/metrics'),
      ]);
      setUser(session.user);
      setItems(queue.items);
      setHistory(decisionHistory.items);
      setMetrics(performance);
      setError('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : copy.loadFailed);
    } finally {
      setLoading(false);
    }
  }, [copy.accessRequired, copy.loadFailed, scope]);
  useEffect(() => {
    void load();
  }, [load]);

  const act = async (action: () => Promise<unknown>) => {
    setBusy(true);
    setError('');
    try {
      await action();
      setSelected(null);
      setNote('');
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : copy.actionFailed);
    } finally {
      setBusy(false);
    }
  };
  const claim = (item: ModerationCase) =>
    act(() => request(`/moderation/cases/${item.caseId}/claim`, { method: 'POST' }));
  const decide = (decision: Decision) =>
    selected &&
    act(() =>
      request(`/moderation/cases/${selected.caseId}/decision`, {
        method: 'POST',
        body: JSON.stringify({ decision, reasonCode, note: note || undefined }),
      }),
    );
  const decideAnnouncement = (decision: 'escalated' | 'rejected') =>
    selected &&
    act(() =>
      request(`/moderation/cases/${selected.caseId}/decision`, {
        method: 'POST',
        body: JSON.stringify({
          decision,
          reasonCode: decision === 'escalated' ? 'ready_for_admin' : 'invalid_submission',
          note: note || undefined,
        }),
      }),
    );
  const moderateBooking = (status: 'processing' | 'confirmed' | 'rejected') =>
    selected &&
    act(() =>
      request(`/moderation/bookings/${selected.entityId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status, ...(status === 'rejected' ? { reason: note } : {}) }),
      }),
    );
  const overdue = useMemo(
    () => items.filter((item) => new Date(item.dueAt) < new Date()).length,
    [items],
  );
  const logout = async () => {
    await request('/auth/logout', { method: 'POST' }).catch(() => undefined);
    window.location.assign('/');
  };

  if (loading && !user) return <div className="admin-loading">{copy.loading}</div>;
  if (error && !user)
    return (
      <div className="admin-denied">
        <ShieldCheck size={42} />
        <h1>{copy.accessUnavailable}</h1>
        <p>{error}</p>
        <a href="/">
          <ArrowLeft size={16} />
          {copy.backHome}
        </a>
      </div>
    );

  return (
    <div className="admin-shell moderator-shell">
      <aside className={mobileNav ? 'admin-sidebar open' : 'admin-sidebar'}>
        <div className="admin-brand">
          <span>M</span>
          <div>
            <b>Bouzid</b>
            <small>{copy.console}</small>
          </div>
        </div>
        <nav>
          <button
            className={view === 'queue' ? 'active' : ''}
            onClick={() => {
              setView('queue');
              setMobileNav(false);
            }}
          >
            <ClipboardCheck size={17} />
            {copy.queue} <i>{items.length}</i>
          </button>
          <button
            className={view === 'history' ? 'active' : ''}
            onClick={() => {
              setView('history');
              setMobileNav(false);
            }}
          >
            <History size={17} />
            {copy.history}
          </button>
        </nav>
        <button className="admin-logout" onClick={() => void logout()}>
          <LogOut size={17} />
          {copy.logout}
        </button>
      </aside>
      <button
        className="admin-menu"
        onClick={() => setMobileNav((open) => !open)}
        aria-label={copy.menu}
      >
        <Menu />
      </button>
      <main className="admin-main">
        <header className="admin-header">
          <div>
            <small>BOUZID ESCAPES / {copy.console}</small>
            <h1>{view === 'queue' ? copy.queue : copy.history}</h1>
          </div>
          <div className="admin-user">
            <span>{roleLabel(user?.role, language)}</span>
            <b>
              {[user?.firstName, user?.lastName].filter(Boolean).join(' ') || `#${user?.userId}`}
            </b>
          </div>
        </header>
        {error && (
          <div className="admin-error">
            {error}
            <button onClick={() => setError('')}>
              <X size={15} />
            </button>
          </div>
        )}
        {view === 'queue' ? (
          <section className="admin-content">
            <div className="stat-grid moderator-stats">
              <article>
                <small>{copy.openQueue}</small>
                <strong>{items.length}</strong>
                <span>{copy.visibleCases}</span>
              </article>
              <article>
                <small>{copy.overdue}</small>
                <strong>{overdue}</strong>
                <span>{copy.pastSla}</span>
              </article>
              <article>
                <small>{copy.decidedToday}</small>
                <strong>{metrics?.today || 0}</strong>
                <span>
                  {metrics?.lastSevenDays || 0} {copy.thisWeek}
                </span>
              </article>
              <article>
                <small>{copy.slaRate}</small>
                <strong>{Math.round((metrics?.slaRate || 0) * 100)}%</strong>
                <span>
                  {(metrics?.averageHours || 0).toFixed(1)}h {copy.average}
                </span>
              </article>
            </div>
            <div className="moderator-toolbar">
              <div>
                <button className={scope === 'all' ? 'active' : ''} onClick={() => setScope('all')}>
                  {copy.all}
                </button>
                <button
                  className={scope === 'mine' ? 'active' : ''}
                  onClick={() => setScope('mine')}
                >
                  {copy.mine}
                </button>
                <button
                  className={scope === 'unassigned' ? 'active' : ''}
                  onClick={() => setScope('unassigned')}
                >
                  {copy.unassigned}
                </button>
              </div>
              <button onClick={() => void load()}>{copy.refresh}</button>
            </div>
            <div className="moderation-layout">
              <div className="moderation-queue">
                {items.map((item) => (
                  <article
                    className={
                      selected?.caseId === item.caseId
                        ? 'moderation-card selected'
                        : 'moderation-card'
                    }
                    key={item.caseId}
                    onClick={() => {
                      setSelected(item);
                      setNote('');
                    }}
                  >
                    <div>
                      <span className={`priority priority-${item.priority}`}>{item.priority}</span>
                      <small>
                        {copy.due} {new Date(item.dueAt).toLocaleString(locale)}
                      </small>
                    </div>
                    <h2>{decodeText(item.title)}</h2>
                    <p>{decodeText(item.description || '') || copy.noDescription}</p>
                    <footer>
                      <span>
                        {item.entityType} #{item.entityId}
                      </span>
                      {item.assignedTo ? (
                        <b>
                          {item.assignedTo === user?.userId ? copy.assignedToYou : copy.assigned}
                        </b>
                      ) : (
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            void claim(item);
                          }}
                        >
                          {copy.claim}
                        </button>
                      )}
                    </footer>
                  </article>
                ))}
              </div>
              {selected && (
                <aside className="review-panel">
                  <div className="review-panel-heading">
                    <div>
                      <small>
                        {selected.entityType} #{selected.entityId}
                      </small>
                      <h2>{decodeText(selected.title)}</h2>
                    </div>
                    <button onClick={() => setSelected(null)}>
                      <X size={17} />
                    </button>
                  </div>
                  {selected.coverImageUrl && (
                    <ResponsiveImage
                      src={selected.coverImageUrl}
                      alt=""
                      width={960}
                      height={720}
                      sizes="(max-width: 900px) 100vw, 48vw"
                    />
                  )}
                  <p>{decodeText(selected.description || '') || copy.noDescription}</p>
                  {!selected.assignedTo ? (
                    <button
                      className="review-primary"
                      disabled={busy}
                      onClick={() => void claim(selected)}
                    >
                      {copy.claimBeforeReview}
                    </button>
                  ) : selected.assignedTo !== user?.userId && user?.role !== 'ADMIN' ? (
                    <p className="review-notice">{copy.assignedElsewhere}</p>
                  ) : selected.entityType === 'booking' ? (
                    <div className="decision-form">
                      <strong>{workflow.bookingReview}</strong>
                      <p>{workflow.bookingHelp}</p>
                      <label>
                        {workflow.rejectionReason}
                        <textarea
                          value={note}
                          onChange={(event) => setNote(event.target.value)}
                          placeholder={workflow.rejectionRequired}
                        />
                      </label>
                      <div>
                        <button
                          className="changes"
                          disabled={busy}
                          onClick={() => void moderateBooking('processing')}
                        >
                          <Clock3 size={15} />
                          {workflow.processing}
                        </button>
                        <button
                          className="approve"
                          disabled={busy}
                          onClick={() => void moderateBooking('confirmed')}
                        >
                          <Check size={15} />
                          {workflow.confirm}
                        </button>
                        <button
                          className="reject"
                          disabled={busy || !note.trim()}
                          onClick={() => void moderateBooking('rejected')}
                        >
                          <X size={15} />
                          {workflow.rejectBooking}
                        </button>
                      </div>
                    </div>
                  ) : selected.entityType === 'announcement' ? (
                    <div className="decision-form">
                      <strong>{workflow.publicationReview}</strong>
                      <p>{workflow.publicationHelp}</p>
                      <label>
                        {copy.note}
                        <textarea
                          value={note}
                          onChange={(event) => setNote(event.target.value)}
                          placeholder={workflow.optionalNote}
                        />
                      </label>
                      <div>
                        <button
                          className="approve"
                          disabled={busy}
                          onClick={() => void decideAnnouncement('escalated')}
                        >
                          <Check size={15} />
                          {workflow.escalateReady}
                        </button>
                        <button
                          className="reject"
                          disabled={busy || !note.trim()}
                          onClick={() => void decideAnnouncement('rejected')}
                        >
                          <X size={15} />
                          {workflow.rejectInvalid}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="decision-form">
                      <label>
                        {copy.reason}
                        <select
                          value={reasonCode}
                          onChange={(event) => setReasonCode(event.target.value)}
                        >
                          <option value="content_quality">{copy.contentQuality}</option>
                          <option value="inaccurate_information">
                            {copy.inaccurateInformation}
                          </option>
                          <option value="policy_violation">{copy.policyViolation}</option>
                          <option value="duplicate">{copy.duplicate}</option>
                          <option value="needs_admin_review">{copy.needsAdminReview}</option>
                        </select>
                      </label>
                      <label>
                        {copy.note}
                        <textarea
                          value={note}
                          onChange={(event) => setNote(event.target.value)}
                          placeholder={copy.notePlaceholder}
                        />
                      </label>
                      <div>
                        <button
                          className="approve"
                          disabled={busy}
                          onClick={() => void decide('approved')}
                        >
                          <Check size={15} />
                          {copy.approve}
                        </button>
                        <button
                          className="changes"
                          disabled={busy || !note.trim()}
                          onClick={() => void decide('changes_requested')}
                        >
                          <Clock3 size={15} />
                          {copy.requestChanges}
                        </button>
                        <button
                          className="reject"
                          disabled={busy || !note.trim()}
                          onClick={() => void decide('rejected')}
                        >
                          <X size={15} />
                          {copy.reject}
                        </button>
                        <button
                          disabled={busy || !note.trim()}
                          onClick={() => void decide('escalated')}
                        >
                          {copy.escalate}
                        </button>
                      </div>
                    </div>
                  )}
                </aside>
              )}
            </div>
          </section>
        ) : (
          <section className="admin-content">
            <div className="table-card">
              <div className="panel-heading">
                <div>
                  <h2>{copy.yourDecisions}</h2>
                  <p>{copy.historyText}</p>
                </div>
              </div>
              <div className="admin-table moderator-history">
                <div className="table-row table-head">
                  <span>{copy.decision}</span>
                  <span>{copy.entity}</span>
                  <span>{copy.reason}</span>
                  <span>{copy.note}</span>
                  <span>{copy.date}</span>
                </div>
                {history.map((item) => (
                  <div className="table-row" key={item.decisionId}>
                    <span>
                      <b>
                        {item.decision === 'approved'
                          ? copy.approved
                          : item.decision === 'rejected'
                            ? copy.rejected
                            : item.decision === 'changes_requested'
                              ? copy.changesRequested
                              : copy.escalated}
                      </b>
                      <small>
                        {copy.case} #{item.caseId}
                      </small>
                    </span>
                    <span>
                      {item.entityType} #{item.entityId}
                    </span>
                    <span>{item.reasonCode.replaceAll('_', ' ')}</span>
                    <span>{item.note || '—'}</span>
                    <span>{new Date(item.createdAt).toLocaleString(locale)}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
