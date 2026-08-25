import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Check, ClipboardCheck, Clock3, History, LogOut, Menu, ShieldCheck, X } from 'lucide-react';
import { request } from '../utils/request';
import { decodeText } from '../utils/decodeText';
import type { ModerationCase, ModerationDecision, ModerationMetrics, ModeratorUser } from './types';
import '../admin/admin.css';
import '../admin/admin-polish.css';
import './moderator.css';

type View = 'queue' | 'history';
type Decision = 'approved' | 'rejected' | 'changes_requested' | 'escalated';

export default function ModeratorDashboard() {
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
      if (!['moderator', 'staff', 'admin', 'ADMIN'].includes(session.user.role)) throw new Error('Moderator access required');
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
      setError(cause instanceof Error ? cause.message : 'Unable to load moderation workspace');
    } finally {
      setLoading(false);
    }
  }, [scope]);
  useEffect(() => { void load(); }, [load]);

  const act = async (action: () => Promise<unknown>) => {
    setBusy(true);
    setError('');
    try {
      await action();
      setSelected(null);
      setNote('');
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Action failed');
    } finally {
      setBusy(false);
    }
  };
  const claim = (item: ModerationCase) => act(() => request(`/moderation/cases/${item.caseId}/claim`, { method: 'POST' }));
  const decide = (decision: Decision) => selected && act(() => request(`/moderation/cases/${selected.caseId}/decision`, { method: 'POST', body: JSON.stringify({ decision, reasonCode, note: note || undefined }) }));
  const overdue = useMemo(() => items.filter((item) => new Date(item.dueAt) < new Date()).length, [items]);
  const logout = async () => { await request('/auth/logout', { method: 'POST' }).catch(() => undefined); window.location.assign('/'); };

  if (loading && !user) return <div className="admin-loading">Loading moderation workspace…</div>;
  if (error && !user) return <div className="admin-denied"><ShieldCheck size={42} /><h1>Access unavailable</h1><p>{error}</p><a href="/"><ArrowLeft size={16} /> Back home</a></div>;

  return <div className="admin-shell moderator-shell">
    <aside className={mobileNav ? 'admin-sidebar open' : 'admin-sidebar'}>
      <div className="admin-brand"><span>M</span><div><b>Bouzid</b><small>MODERATION</small></div></div>
      <nav>
        <button className={view === 'queue' ? 'active' : ''} onClick={() => { setView('queue'); setMobileNav(false); }}><ClipboardCheck size={17} />Review queue <i>{items.length}</i></button>
        <button className={view === 'history' ? 'active' : ''} onClick={() => { setView('history'); setMobileNav(false); }}><History size={17} />Decision history</button>
      </nav>
      <button className="admin-logout" onClick={() => void logout()}><LogOut size={17} />Log out</button>
    </aside>
    <button className="admin-menu" onClick={() => setMobileNav((open) => !open)} aria-label="Moderator menu"><Menu /></button>
    <main className="admin-main">
      <header className="admin-header"><div><small>BOUZID ESCAPES / MODERATION</small><h1>{view === 'queue' ? 'Review queue' : 'Decision history'}</h1></div><div className="admin-user"><span>{user?.role}</span><b>{[user?.firstName, user?.lastName].filter(Boolean).join(' ') || `#${user?.userId}`}</b></div></header>
      {error && <div className="admin-error">{error}<button onClick={() => setError('')}><X size={15} /></button></div>}
      {view === 'queue' ? <section className="admin-content">
        <div className="stat-grid moderator-stats"><article><small>OPEN QUEUE</small><strong>{items.length}</strong><span>Visible cases</span></article><article><small>OVERDUE</small><strong>{overdue}</strong><span>Past 24-hour SLA</span></article><article><small>DECIDED TODAY</small><strong>{metrics?.today || 0}</strong><span>{metrics?.lastSevenDays || 0} this week</span></article><article><small>SLA RATE</small><strong>{Math.round((metrics?.slaRate || 0) * 100)}%</strong><span>{(metrics?.averageHours || 0).toFixed(1)}h average</span></article></div>
        <div className="moderator-toolbar"><div><button className={scope === 'all' ? 'active' : ''} onClick={() => setScope('all')}>All</button><button className={scope === 'mine' ? 'active' : ''} onClick={() => setScope('mine')}>Mine</button><button className={scope === 'unassigned' ? 'active' : ''} onClick={() => setScope('unassigned')}>Unassigned</button></div><button onClick={() => void load()}>Refresh</button></div>
        <div className="moderation-layout"><div className="moderation-queue">{items.map((item) => <article className={selected?.caseId === item.caseId ? 'moderation-card selected' : 'moderation-card'} key={item.caseId} onClick={() => setSelected(item)}><div><span className={`priority priority-${item.priority}`}>{item.priority}</span><small>Due {new Date(item.dueAt).toLocaleString()}</small></div><h2>{decodeText(item.title)}</h2><p>{decodeText(item.description || '') || 'No description provided.'}</p><footer><span>{item.entityType} #{item.entityId}</span>{item.assignedTo ? <b>{item.assignedTo === user?.userId ? 'Assigned to you' : 'Assigned'}</b> : <button onClick={(event) => { event.stopPropagation(); void claim(item); }}>Claim</button>}</footer></article>)}</div>
          {selected && <aside className="review-panel"><div className="review-panel-heading"><div><small>{selected.entityType} #{selected.entityId}</small><h2>{decodeText(selected.title)}</h2></div><button onClick={() => setSelected(null)}><X size={17} /></button></div>{selected.coverImageUrl && <img src={selected.coverImageUrl} alt="" />}<p>{decodeText(selected.description || '') || 'No description provided.'}</p>{!selected.assignedTo ? <button className="review-primary" disabled={busy} onClick={() => void claim(selected)}>Claim before review</button> : selected.assignedTo !== user?.userId && !['admin', 'ADMIN'].includes(user?.role || '') ? <p className="review-notice">This case is assigned to another moderator.</p> : <div className="decision-form"><label>Reason<select value={reasonCode} onChange={(event) => setReasonCode(event.target.value)}><option value="content_quality">Content quality</option><option value="inaccurate_information">Inaccurate information</option><option value="policy_violation">Policy violation</option><option value="duplicate">Duplicate</option><option value="needs_admin_review">Needs admin review</option></select></label><label>Moderator note<textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Required context for rejection or escalation" /></label><div><button className="approve" disabled={busy} onClick={() => void decide('approved')}><Check size={15} />Approve</button><button className="changes" disabled={busy || !note.trim()} onClick={() => void decide('changes_requested')}><Clock3 size={15} />Request changes</button><button className="reject" disabled={busy || !note.trim()} onClick={() => void decide('rejected')}><X size={15} />Reject</button><button disabled={busy || !note.trim()} onClick={() => void decide('escalated')}>Escalate</button></div></div>}</aside>}
        </div>
      </section> : <section className="admin-content"><div className="table-card"><div className="panel-heading"><div><h2>Your decisions</h2><p>Complete moderation history for this account.</p></div></div><div className="admin-table moderator-history"><div className="table-row table-head"><span>Decision</span><span>Entity</span><span>Reason</span><span>Note</span><span>Date</span></div>{history.map((item) => <div className="table-row" key={item.decisionId}><span><b>{item.decision.replace('_', ' ')}</b><small>Case #{item.caseId}</small></span><span>{item.entityType} #{item.entityId}</span><span>{item.reasonCode.replaceAll('_', ' ')}</span><span>{item.note || '—'}</span><span>{new Date(item.createdAt).toLocaleString()}</span></div>)}</div></div></section>}
    </main>
  </div>;
}
