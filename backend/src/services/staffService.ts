import { query, transaction } from '../config/db';
import { AppError } from '../utils/errorHandler';
import { decodeStoredText } from '../utils/sanitize';
import { deleteUploadUrls } from '../middleware/listingUpload';

export class AdminDashboardService {
  static async overview(days: number) {
    const [summary, trend, categories, queue] = await Promise.all([
      query<any>(
        `SELECT
          (SELECT COUNT(*)::int FROM users) AS total_users,
          (SELECT COUNT(*)::int FROM users WHERE created_at >= now() - ($1 * interval '1 day')) AS new_users,
          (SELECT COUNT(*)::int FROM listings WHERE status = 'approved' AND is_active = true) AS active_listings,
          (SELECT COUNT(*)::int FROM listings WHERE status = 'pending') AS pending_listings,
          (SELECT COUNT(*)::int FROM announcement_requests WHERE status = 'PENDING') AS pending_requests,
          (SELECT COUNT(*)::int FROM bookings WHERE created_at >= now() - ($1 * interval '1 day')) AS bookings,
          (SELECT COALESCE(SUM(total), 0)::numeric FROM bookings WHERE status IN ('confirmed', 'completed') AND created_at >= now() - ($1 * interval '1 day')) AS gross_booking_value,
          (SELECT COUNT(*)::int FROM bookings WHERE status = 'cancelled' AND created_at >= now() - ($1 * interval '1 day')) AS cancelled_bookings`,
        [days],
      ),
      query<any>(
        `SELECT day::date,
          COUNT(b.booking_id)::int AS bookings,
          COALESCE(SUM(b.total) FILTER (WHERE b.status IN ('confirmed', 'completed')), 0)::numeric AS gross_booking_value
        FROM generate_series((current_date - ($1::int - 1)), current_date, interval '1 day') day
        LEFT JOIN bookings b ON b.created_at >= day AND b.created_at < day + interval '1 day'
        GROUP BY day ORDER BY day`,
        [days],
      ),
      query<any>(
        `SELECT c.slug, c.name, COUNT(DISTINCT l.listing_id)::int AS listings,
          COUNT(DISTINCT b.booking_id)::int AS bookings,
          COALESCE(SUM(b.total) FILTER (WHERE b.status IN ('confirmed', 'completed')), 0)::numeric AS gross_booking_value
        FROM categories c
        LEFT JOIN listings l ON l.category_id = c.category_id
        LEFT JOIN bookings b ON b.listing_id = l.listing_id AND b.created_at >= now() - ($1 * interval '1 day')
        GROUP BY c.category_id, c.slug, c.name
        ORDER BY gross_booking_value DESC, listings DESC LIMIT 10`,
        [days],
      ),
      query<any>(
        `SELECT
          COUNT(*) FILTER (WHERE status IN ('open', 'claimed'))::int AS open,
          COUNT(*) FILTER (WHERE status IN ('open', 'claimed') AND due_at < now())::int AS overdue,
          COALESCE(EXTRACT(EPOCH FROM (now() - MIN(created_at) FILTER (WHERE status IN ('open', 'claimed')))) / 3600, 0)::numeric AS oldest_hours
        FROM moderation_cases`,
      ),
    ]);
    const row = summary.rows[0] || {};
    const bookingCount = Number(row.bookings || 0);
    return {
      period: { days },
      kpis: {
        totalUsers: Number(row.total_users || 0),
        newUsers: Number(row.new_users || 0),
        activeListings: Number(row.active_listings || 0),
        pendingListings: Number(row.pending_listings || 0),
        pendingRequests: Number(row.pending_requests || 0),
        bookings: bookingCount,
        grossBookingValue: Number(row.gross_booking_value || 0),
        cancellationRate: bookingCount ? Number(row.cancelled_bookings || 0) / bookingCount : 0,
      },
      trend: trend.rows.map((item) => ({
        date: item.day,
        bookings: Number(item.bookings || 0),
        grossBookingValue: Number(item.gross_booking_value || 0),
      })),
      categories: categories.rows.map((item) => ({
        slug: item.slug,
        name: decodeStoredText(item.name),
        listings: Number(item.listings || 0),
        bookings: Number(item.bookings || 0),
        grossBookingValue: Number(item.gross_booking_value || 0),
      })),
      moderation: {
        open: Number(queue.rows[0]?.open || 0),
        overdue: Number(queue.rows[0]?.overdue || 0),
        oldestHours: Number(queue.rows[0]?.oldest_hours || 0),
      },
    };
  }

  static async audit(params: { page: number; limit: number; entityType?: string; actorId?: number }) {
    const values: unknown[] = [];
    const clauses: string[] = [];
    if (params.entityType) { values.push(params.entityType); clauses.push(`a.entity_type = $${values.length}`); }
    if (params.actorId) { values.push(params.actorId); clauses.push(`a.actor_id = $${values.length}`); }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const count = await query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM audit_logs a ${where}`, values);
    const offset = (params.page - 1) * params.limit;
    const result = await query<any>(
      `SELECT a.id, a.actor_id, a.action, a.entity_type, a.entity_id, a.reason, a.created_at,
        u.first_name, u.last_name, u.email
       FROM audit_logs a LEFT JOIN users u ON u.user_id = a.actor_id
       ${where} ORDER BY a.created_at DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
      [...values, params.limit, offset],
    );
    const total = Number(count.rows[0]?.count || 0);
    return {
      items: result.rows.map((row) => ({
        id: row.id, actorId: row.actor_id, action: row.action, entityType: row.entity_type,
        entityId: row.entity_id, reason: row.reason, createdAt: row.created_at,
        actor: row.actor_id ? { firstName: row.first_name, lastName: row.last_name, email: row.email } : null,
      })),
      pagination: { total, page: params.page, limit: params.limit, totalPages: Math.ceil(total / params.limit) },
    };
  }
}

export class ModerationService {
  private static async syncCases() {
    await query(
      `INSERT INTO moderation_cases (entity_type, entity_id, created_at, due_at)
       SELECT 'listing', listing_id, COALESCE(submitted_at, created_at), COALESCE(submitted_at, created_at) + interval '24 hours'
       FROM listings WHERE status = 'pending'
       ON CONFLICT (entity_type, entity_id) DO NOTHING`,
    );
    await query(
      `INSERT INTO moderation_cases (entity_type, entity_id, created_at, due_at)
       SELECT 'booking', booking_id, created_at, created_at + interval '4 hours'
       FROM bookings WHERE status IN ('pending','processing')
       ON CONFLICT (entity_type, entity_id) DO NOTHING`,
    );
    await query(
      `INSERT INTO moderation_cases (entity_type, entity_id, created_at, due_at)
       SELECT 'announcement', request_id, created_at, created_at + interval '24 hours'
       FROM announcement_requests WHERE status = 'PENDING'
       ON CONFLICT (entity_type, entity_id) DO NOTHING`,
    );
  }

  static async queue(userId: number, params: { scope: 'all' | 'mine' | 'unassigned'; status?: string; entityType?: string; page: number; limit: number }) {
    await this.syncCases();
    const values: unknown[] = [];
    const clauses = ['mc.status IN (\'open\', \'claimed\', \'escalated\')'];
    if (params.scope === 'mine') { values.push(userId); clauses.push(`mc.assigned_to = $${values.length}`); }
    if (params.scope === 'unassigned') clauses.push('mc.assigned_to IS NULL');
    if (params.status) { values.push(params.status); clauses.push(`mc.status = $${values.length}`); }
    if (params.entityType) { values.push(params.entityType); clauses.push(`mc.entity_type = $${values.length}`); }
    const where = `WHERE ${clauses.join(' AND ')}`;
    const count = await query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM moderation_cases mc ${where}`, values);
    const offset = (params.page - 1) * params.limit;
    const result = await query<any>(
      `SELECT mc.*, u.first_name AS assignee_first_name, u.last_name AS assignee_last_name,
        CASE WHEN mc.entity_type = 'listing' THEN l.title WHEN mc.entity_type='announcement' THEN ar.title ELSE 'Booking #' || b.booking_id END AS title,
        CASE WHEN mc.entity_type = 'listing' THEN l.description WHEN mc.entity_type='announcement' THEN ar.description ELSE b.contact_email END AS description,
        CASE WHEN mc.entity_type = 'listing' THEN l.status WHEN mc.entity_type='announcement' THEN ar.status ELSE b.status END AS entity_status,
        CASE WHEN mc.entity_type = 'listing' THEN l.cover_image_url ELSE NULL END AS cover_image_url
       FROM moderation_cases mc
       LEFT JOIN users u ON u.user_id = mc.assigned_to
       LEFT JOIN listings l ON mc.entity_type = 'listing' AND l.listing_id = mc.entity_id
       LEFT JOIN announcement_requests ar ON mc.entity_type = 'announcement' AND ar.request_id = mc.entity_id
       LEFT JOIN bookings b ON mc.entity_type = 'booking' AND b.booking_id = mc.entity_id
       ${where}
       ORDER BY CASE mc.priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'normal' THEN 3 ELSE 4 END,
         mc.due_at, mc.created_at
       LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
      [...values, params.limit, offset],
    );
    const total = Number(count.rows[0]?.count || 0);
    return {
      items: result.rows.map((row) => ({
        caseId: row.case_id, entityType: row.entity_type, entityId: row.entity_id,
        title: decodeStoredText(row.title || ''), description: row.description ? decodeStoredText(row.description) : null,
        entityStatus: row.entity_status, coverImageUrl: row.cover_image_url, priority: row.priority,
        status: row.status, assignedTo: row.assigned_to, dueAt: row.due_at, createdAt: row.created_at,
        assignee: row.assigned_to ? { firstName: row.assignee_first_name, lastName: row.assignee_last_name } : null,
      })),
      pagination: { total, page: params.page, limit: params.limit, totalPages: Math.ceil(total / params.limit) },
    };
  }

  static async claim(caseId: number, actorId: number) {
    return transaction(async (client) => {
      const result = await client.query<any>(
        `UPDATE moderation_cases SET assigned_to = $1, status = 'claimed', updated_at = now()
         WHERE case_id = $2 AND status IN ('open', 'claimed') AND (assigned_to IS NULL OR assigned_to = $1)
         RETURNING *`,
        [actorId, caseId],
      );
      if (!result.rows[0]) throw new AppError(409, 'Moderation case is already claimed or closed');
      return { caseId: result.rows[0].case_id, assignedTo: result.rows[0].assigned_to, status: result.rows[0].status };
    });
  }

  static async decide(caseId: number, actorId: number, actorRole: string, data: { decision: 'approved' | 'rejected' | 'changes_requested' | 'escalated'; reasonCode: string; note?: string }) {
    if (actorRole !== 'ADMIN') throw new AppError(403, 'Administrator access required');
    let deleteUrls: string[] = [];
    const response = await transaction(async (client) => {
      const caseResult = await client.query<any>('SELECT * FROM moderation_cases WHERE case_id = $1 FOR UPDATE', [caseId]);
      const item = caseResult.rows[0];
      if (!item) throw new AppError(404, 'Moderation case not found');
      if (item.status === 'decided') throw new AppError(409, 'Moderation case is already decided');
      if (item.assigned_to && item.assigned_to !== actorId) throw new AppError(409, 'Moderation case is assigned to another moderator');

      const targetStatus = data.decision === 'approved' ? 'approved' : data.decision === 'escalated' ? null : 'rejected';
      let previousState: Record<string, unknown> = {};
      let nextState: Record<string, unknown> = {};
      if (item.entity_type === 'listing') {
        const current = await client.query<any>('SELECT status, is_active FROM listings WHERE listing_id = $1 FOR UPDATE', [item.entity_id]);
        if (!current.rows[0]) throw new AppError(404, 'Listing not found');
        previousState = current.rows[0];
        if (targetStatus) {
          const updated = await client.query<any>(
            `UPDATE listings SET status = $1, is_active = ($1 = 'approved'), reviewed_at = now(), reviewed_by = $2,
              rejection_reason = CASE WHEN $1 = 'rejected' THEN $3 ELSE NULL END, updated_at = now()
             WHERE listing_id = $4 RETURNING status, is_active`,
            [targetStatus, actorId, data.note || data.reasonCode, item.entity_id],
          );
          nextState = updated.rows[0];
        } else nextState = previousState;
      } else if (item.entity_type === 'announcement') {
        const isAdmin = actorRole === 'ADMIN';
        if (!isAdmin && !['rejected','escalated'].includes(data.decision)) throw new AppError(403, 'Moderators may only reject or escalate publication requests');
        if (isAdmin && item.status === 'escalated') throw new AppError(409, 'Use the final publication review endpoint');
        const current = await client.query<any>('SELECT status FROM announcement_requests WHERE request_id = $1 FOR UPDATE', [item.entity_id]);
        if (!current.rows[0]) throw new AppError(404, 'Publication request not found');
        previousState = current.rows[0];
        if (targetStatus) {
          const updated = await client.query<any>(
            `UPDATE announcement_requests SET status = upper($1), reviewed_by = $2, review_reason = $3, updated_at = now()
             WHERE request_id = $4 RETURNING status`,
            [targetStatus, actorId, data.note || data.reasonCode, item.entity_id],
          );
          nextState = updated.rows[0];
        } else {
          await client.query('UPDATE announcement_requests SET status=\'ESCALATED\',reviewed_by=$1,review_reason=$2,updated_at=now() WHERE request_id=$3',[actorId,data.note||data.reasonCode,item.entity_id]);
          nextState = { status: 'ESCALATED' };
        }
        if (data.decision === 'rejected') {
          const images = await client.query<{url:string}>('SELECT url FROM announcement_request_images WHERE request_id=$1',[item.entity_id]);
          deleteUrls = images.rows.map(image => image.url);
          await client.query('DELETE FROM announcement_requests WHERE request_id=$1',[item.entity_id]);
        }
      } else {
        throw new AppError(400, 'Use the booking moderation endpoint');
      }
      const nextCaseStatus = data.decision === 'escalated' ? 'escalated' : 'decided';
      await client.query(
        'UPDATE moderation_cases SET assigned_to = $1, status = $2, updated_at = now() WHERE case_id = $3',
        [actorId, nextCaseStatus, caseId],
      );
      const decision = await client.query<any>(
        `INSERT INTO moderation_decisions (case_id, actor_id, decision, reason_code, note, previous_state, next_state)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING decision_id, created_at`,
        [caseId, actorId, data.decision, data.reasonCode, data.note || null, previousState, nextState],
      );
      await client.query(
        'INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, reason) VALUES ($1,$2,$3,$4,$5)',
        [actorId, `moderation:${data.decision}`, item.entity_type, item.entity_id, data.note || data.reasonCode],
      );
      return { decisionId: decision.rows[0].decision_id, caseId, decision: data.decision, createdAt: decision.rows[0].created_at };
    });
    await deleteUploadUrls(deleteUrls);
    return response;
  }

  static async moderateBooking(bookingId: number, actorId: number, actorRole: string, status: 'processing'|'confirmed'|'rejected', reason?: string) {
    if (actorRole !== 'ADMIN') throw new AppError(403, 'Administrator access required');
    return transaction(async client => {
      const result = await client.query<any>(`UPDATE bookings SET status=$1,processed_by=$2,processed_at=now(),
        rejection_reason=CASE WHEN $1='rejected' THEN $3 ELSE NULL END WHERE booking_id=$4 AND status IN ('pending','processing') RETURNING *`,
        [status,actorId,reason||null,bookingId]);
      if (!result.rows[0]) throw new AppError(409, 'Booking was not found or is no longer awaiting moderation');
      await client.query('UPDATE moderation_cases SET assigned_to=$1,status=$2,updated_at=now() WHERE entity_type=\'booking\' AND entity_id=$3',[actorId,status==='processing'?'claimed':'decided',bookingId]);
      await client.query('INSERT INTO audit_logs(actor_id,action,entity_type,entity_id,reason) VALUES($1,$2,$3,$4,$5)',[actorId,`booking:${status}`,'booking',bookingId,reason||null]);
      return { bookingId, status, processedAt: result.rows[0].processed_at, rejectionReason: result.rows[0].rejection_reason };
    });
  }

  static async history(actorId: number, limit = 50) {
    const result = await query<any>(
      `SELECT md.decision_id, md.decision, md.reason_code, md.note, md.created_at,
        mc.case_id, mc.entity_type, mc.entity_id
       FROM moderation_decisions md JOIN moderation_cases mc ON mc.case_id = md.case_id
       WHERE md.actor_id = $1 ORDER BY md.created_at DESC LIMIT $2`,
      [actorId, limit],
    );
    return result.rows.map((row) => ({
      decisionId: row.decision_id, caseId: row.case_id, entityType: row.entity_type,
      entityId: row.entity_id, decision: row.decision, reasonCode: row.reason_code,
      note: row.note, createdAt: row.created_at,
    }));
  }

  static async metrics(actorId: number) {
    const result = await query<any>(
      `SELECT
        COUNT(*) FILTER (WHERE md.created_at >= current_date)::int AS today,
        COUNT(*) FILTER (WHERE md.created_at >= now() - interval '7 days')::int AS last_seven_days,
        COALESCE(AVG(EXTRACT(EPOCH FROM (md.created_at - mc.created_at)) / 3600), 0)::numeric AS average_hours,
        COUNT(*) FILTER (WHERE md.created_at <= mc.due_at)::int AS within_sla,
        COUNT(*)::int AS total
       FROM moderation_decisions md JOIN moderation_cases mc ON mc.case_id = md.case_id
       WHERE md.actor_id = $1`,
      [actorId],
    );
    const row = result.rows[0] || {};
    const total = Number(row.total || 0);
    return { today: Number(row.today || 0), lastSevenDays: Number(row.last_seven_days || 0), averageHours: Number(row.average_hours || 0), slaRate: total ? Number(row.within_sla || 0) / total : 1, total };
  }
}
