import { query, transaction } from '../config/db';
import { AppError } from '../utils/errorHandler';
import { decodeStoredText } from '../utils/sanitize';
import { deleteUploadUrls } from '../middleware/listingUpload';

export class AdminDashboardService {
  static async overview(days: number) {
    const [summary, trend, categories, queue] = await Promise.all([
      query<any>(
        `SELECT
          (SELECT COUNT(*) FROM users) AS total_users,
          (SELECT COUNT(*) FROM users WHERE created_at >= DATE_SUB(now(), INTERVAL ? DAY)) AS new_users,
          (SELECT COUNT(*) FROM listings WHERE status = 'approved' AND is_active = true) AS active_listings,
          (SELECT COUNT(*) FROM listings WHERE status = 'pending') AS pending_listings,
          (SELECT COUNT(*) FROM announcement_requests WHERE status = 'PENDING') AS pending_requests,
          (SELECT COUNT(*) FROM bookings WHERE created_at >= DATE_SUB(now(), INTERVAL ? DAY)) AS bookings,
          (SELECT COUNT(*) FROM bookings WHERE status IN ('pending','processing')) AS pending_bookings,
          (SELECT COALESCE(SUM(total), 0) FROM bookings WHERE status IN ('confirmed', 'completed') AND created_at >= DATE_SUB(now(), INTERVAL ? DAY)) AS gross_booking_value,
          (SELECT COUNT(*) FROM bookings WHERE status = 'cancelled' AND created_at >= DATE_SUB(now(), INTERVAL ? DAY)) AS cancelled_bookings`,
        [days, days, days, days],
      ),
      query<any>(
        `WITH RECURSIVE dates(day) AS (
          SELECT DATE_SUB(CURRENT_DATE, INTERVAL (? - 1) DAY)
          UNION ALL SELECT DATE_ADD(day, INTERVAL 1 DAY) FROM dates WHERE day < CURRENT_DATE
        ) SELECT day,
          COUNT(b.booking_id) AS bookings,
          COALESCE(SUM(CASE WHEN b.status IN ('confirmed', 'completed') THEN b.total ELSE 0 END), 0) AS gross_booking_value
        FROM dates
        LEFT JOIN bookings b ON b.created_at >= day AND b.created_at < DATE_ADD(day, INTERVAL 1 DAY)
        GROUP BY day ORDER BY day`,
        [days],
      ),
      query<any>(
        `SELECT c.slug, c.name, COUNT(DISTINCT l.listing_id) AS listings,
          COUNT(DISTINCT b.booking_id) AS bookings,
          COALESCE(SUM(CASE WHEN b.status IN ('confirmed', 'completed') THEN b.total ELSE 0 END), 0) AS gross_booking_value
        FROM categories c
        LEFT JOIN listings l ON l.category_id = c.category_id
        LEFT JOIN bookings b ON b.listing_id = l.listing_id AND b.created_at >= DATE_SUB(now(), INTERVAL ? DAY)
        GROUP BY c.category_id, c.slug, c.name
        ORDER BY gross_booking_value DESC, listings DESC LIMIT 10`,
        [days],
      ),
      query<any>(
        `SELECT
          SUM(CASE WHEN status IN ('open', 'claimed') THEN 1 ELSE 0 END) AS open,
          SUM(CASE WHEN status IN ('open', 'claimed') AND due_at < now() THEN 1 ELSE 0 END) AS overdue,
          COALESCE(TIMESTAMPDIFF(SECOND, MIN(CASE WHEN status IN ('open', 'claimed') THEN created_at END), now()) / 3600, 0) AS oldest_hours
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
        pendingBookings: Number(row.pending_bookings || 0),
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
    if (params.entityType) { values.push(params.entityType); clauses.push('a.entity_type = ?'); }
    if (params.actorId) { values.push(params.actorId); clauses.push('a.actor_id = ?'); }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const count = await query<{ count: string }>(`SELECT COUNT(*) AS count FROM audit_logs a ${where}`, values);
    const offset = (params.page - 1) * params.limit;
    const result = await query<any>(
      `SELECT a.id, a.actor_id, a.action, a.entity_type, a.entity_id, a.reason, a.created_at,
        u.first_name, u.last_name, u.email
       FROM audit_logs a LEFT JOIN users u ON u.user_id = a.actor_id
       ${where} ORDER BY a.created_at DESC LIMIT ? OFFSET ?`,
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

export class AdminApprovalService {
  private static async syncCases() {
    await query(
      `INSERT INTO moderation_cases (entity_type, entity_id, created_at, due_at)
       SELECT 'listing', listing_id, COALESCE(submitted_at, created_at), COALESCE(submitted_at, created_at) + INTERVAL 24 HOUR
       FROM listings WHERE status = 'pending'
       ON DUPLICATE KEY UPDATE entity_id=moderation_cases.entity_id`,
    );
    await query(
      `INSERT INTO moderation_cases (entity_type, entity_id, created_at, due_at)
       SELECT 'booking', booking_id, created_at, created_at + INTERVAL 4 HOUR
       FROM bookings WHERE status IN ('pending','processing')
       ON DUPLICATE KEY UPDATE entity_id=moderation_cases.entity_id`,
    );
    await query(
      `INSERT INTO moderation_cases (entity_type, entity_id, created_at, due_at)
       SELECT 'announcement', request_id, created_at, created_at + INTERVAL 24 HOUR
       FROM announcement_requests WHERE status = 'PENDING'
       ON DUPLICATE KEY UPDATE entity_id=moderation_cases.entity_id`,
    );
  }

  static async queue(userId: number, params: { scope: 'all' | 'mine' | 'unassigned'; status?: string; entityType?: string; page: number; limit: number }) {
    await this.syncCases();
    const values: unknown[] = [];
    const clauses = ['mc.status IN (\'open\', \'claimed\', \'escalated\')'];
    if (params.scope === 'mine') { values.push(userId); clauses.push('mc.assigned_to = ?'); }
    if (params.scope === 'unassigned') clauses.push('mc.assigned_to IS NULL');
    if (params.status) { values.push(params.status); clauses.push('mc.status = ?'); }
    if (params.entityType) { values.push(params.entityType); clauses.push('mc.entity_type = ?'); }
    const where = `WHERE ${clauses.join(' AND ')}`;
    const count = await query<{ count: string }>(`SELECT COUNT(*) AS count FROM moderation_cases mc ${where}`, values);
    const offset = (params.page - 1) * params.limit;
    const result = await query<any>(
      `SELECT mc.*, u.first_name AS assignee_first_name, u.last_name AS assignee_last_name,
        CASE WHEN mc.entity_type = 'listing' THEN l.title WHEN mc.entity_type='announcement' THEN ar.title ELSE CONCAT('Booking #', b.booking_id) END AS title,
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
       LIMIT ? OFFSET ?`,
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
        `UPDATE moderation_cases SET assigned_to = ?, status = 'claimed', updated_at = now()
         WHERE case_id = ? AND status IN ('open', 'claimed') AND (assigned_to IS NULL OR assigned_to = ?)
        `,
        [actorId, caseId, actorId],
      );
      if (!result.rowCount) throw new AppError(409, 'Moderation case is already claimed or closed');
      return { caseId, assignedTo: actorId, status: 'claimed' };
    });
  }

  static async decide(caseId: number, actorId: number, actorRole: string, data: { decision: 'approved' | 'rejected' | 'changes_requested' | 'escalated'; reasonCode: string; note?: string }) {
    if (actorRole !== 'ADMIN') throw new AppError(403, 'Administrator access required');
    let deleteUrls: string[] = [];
    const response = await transaction(async (client) => {
      const caseResult = await client.query<any>('SELECT * FROM moderation_cases WHERE case_id = ? FOR UPDATE', [caseId]);
      const item = caseResult.rows[0];
      if (!item) throw new AppError(404, 'Moderation case not found');
      if (item.status === 'decided') throw new AppError(409, 'Moderation case is already decided');
      if (item.assigned_to && item.assigned_to !== actorId) throw new AppError(409, 'Approval case is assigned to another administrator');

      const targetStatus = data.decision === 'approved' ? 'approved' : data.decision === 'changes_requested' ? 'changes_requested' : data.decision === 'escalated' ? null : 'rejected';
      let previousState: Record<string, unknown> = {};
      let nextState: Record<string, unknown> = {};
      if (item.entity_type === 'listing') {
        const current = await client.query<any>('SELECT status, is_active FROM listings WHERE listing_id = ? FOR UPDATE', [item.entity_id]);
        if (!current.rows[0]) throw new AppError(404, 'Listing not found');
        previousState = current.rows[0];
        if (targetStatus) {
          const updated = await client.query<any>(
            `UPDATE listings SET status = ?, is_active = (? = 'approved'), reviewed_at = now(), reviewed_by = ?,
              rejection_reason = CASE WHEN ? IN ('rejected', 'changes_requested') THEN ? ELSE NULL END, updated_at = now()
             WHERE listing_id = ?`,
            [targetStatus, targetStatus, actorId, targetStatus, data.note || data.reasonCode, item.entity_id],
          );
          nextState = { status: targetStatus, is_active: targetStatus === 'approved' };
        } else nextState = previousState;
      } else if (item.entity_type === 'announcement') {
        if (item.status === 'escalated') throw new AppError(409, 'Use the final publication review endpoint');
        const current = await client.query<any>('SELECT status FROM announcement_requests WHERE request_id = ? FOR UPDATE', [item.entity_id]);
        if (!current.rows[0]) throw new AppError(404, 'Publication request not found');
        previousState = current.rows[0];
        const announcementStatus = data.decision === 'changes_requested'
          ? 'ESCALATED'
          : targetStatus?.toUpperCase();
        if (announcementStatus) {
          const updated = await client.query<any>(
            `UPDATE announcement_requests SET status = ?, reviewed_by = ?, review_reason = ?, updated_at = now()
             WHERE request_id = ?`,
            [announcementStatus, actorId, data.note || data.reasonCode, item.entity_id],
          );
          nextState = { status: announcementStatus };
        } else {
          await client.query('UPDATE announcement_requests SET status=\'ESCALATED\',reviewed_by=?,review_reason=?,updated_at=now() WHERE request_id=?',[actorId,data.note||data.reasonCode,item.entity_id]);
          nextState = { status: 'ESCALATED' };
        }
        if (data.decision === 'rejected') {
          const images = await client.query<{url:string}>('SELECT url FROM announcement_request_images WHERE request_id=?',[item.entity_id]);
          deleteUrls = images.rows.map(image => image.url);
          await client.query('DELETE FROM announcement_requests WHERE request_id=?',[item.entity_id]);
        }
      } else {
        throw new AppError(400, 'Use the booking review endpoint');
      }
      const nextCaseStatus = ['escalated', 'changes_requested'].includes(data.decision)
        ? 'escalated'
        : 'decided';
      await client.query(
        'UPDATE moderation_cases SET assigned_to = ?, status = ?, updated_at = now() WHERE case_id = ?',
        [actorId, nextCaseStatus, caseId],
      );
      const decision = await client.query<any>(
        `INSERT INTO moderation_decisions (case_id, actor_id, decision, reason_code, note, previous_state, next_state)
         VALUES (?,?,?,?,?,?,?)`,
        [caseId, actorId, data.decision, data.reasonCode, data.note || null, JSON.stringify(previousState), JSON.stringify(nextState)],
      );
      await client.query(
        'INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, reason) VALUES (?,?,?,?,?)',
        [actorId, `moderation:${data.decision}`, item.entity_type, item.entity_id, data.note || data.reasonCode],
      );
      const saved = await client.query<any>('SELECT created_at FROM moderation_decisions WHERE decision_id=?', [decision.insertId]);
      return { decisionId: decision.insertId, caseId, decision: data.decision, createdAt: saved.rows[0].created_at };
    });
    await deleteUploadUrls(deleteUrls);
    return response;
  }

  static async reviewBooking(bookingId: number, actorId: number, actorRole: string, status: 'processing'|'confirmed'|'rejected', reason?: string) {
    if (actorRole !== 'ADMIN') throw new AppError(403, 'Administrator access required');
    return transaction(async client => {
      const result = await client.query<any>(`UPDATE bookings SET status=?,processed_by=?,processed_at=now(),
        rejection_reason=CASE WHEN ?='rejected' THEN ? ELSE NULL END WHERE booking_id=? AND status IN ('pending','processing')`,
        [status,actorId,status,reason||null,bookingId]);
      if (!result.rowCount) throw new AppError(409, 'Booking was not found or is no longer awaiting review');
      await client.query('UPDATE moderation_cases SET assigned_to=?,status=?,updated_at=now() WHERE entity_type=\'booking\' AND entity_id=?',[actorId,status==='processing'?'claimed':'decided',bookingId]);
      await client.query('INSERT INTO audit_logs(actor_id,action,entity_type,entity_id,reason) VALUES(?,?,?,?,?)',[actorId,`booking:${status}`,'booking',bookingId,reason||null]);
      const saved = await client.query<any>('SELECT processed_at,rejection_reason FROM bookings WHERE booking_id=?', [bookingId]);
      return { bookingId, status, processedAt: saved.rows[0].processed_at, rejectionReason: saved.rows[0].rejection_reason };
    });
  }

  static async history(actorId: number, limit = 50) {
    const result = await query<any>(
      `SELECT md.decision_id, md.decision, md.reason_code, md.note, md.created_at,
        mc.case_id, mc.entity_type, mc.entity_id
       FROM moderation_decisions md JOIN moderation_cases mc ON mc.case_id = md.case_id
       WHERE md.actor_id = ? ORDER BY md.created_at DESC LIMIT ?`,
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
        SUM(CASE WHEN md.created_at >= CURRENT_DATE THEN 1 ELSE 0 END) AS today,
        SUM(CASE WHEN md.created_at >= DATE_SUB(now(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) AS last_seven_days,
        COALESCE(AVG(TIMESTAMPDIFF(SECOND, mc.created_at, md.created_at) / 3600), 0) AS average_hours,
        SUM(CASE WHEN md.created_at <= mc.due_at THEN 1 ELSE 0 END) AS within_sla,
        COUNT(*) AS total
       FROM moderation_decisions md JOIN moderation_cases mc ON mc.case_id = md.case_id
       WHERE md.actor_id = ?`,
      [actorId],
    );
    const row = result.rows[0] || {};
    const total = Number(row.total || 0);
    return { today: Number(row.today || 0), lastSevenDays: Number(row.last_seven_days || 0), averageHours: Number(row.average_hours || 0), slaRate: total ? Number(row.within_sla || 0) / total : 1, total };
  }
}
