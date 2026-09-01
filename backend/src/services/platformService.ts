import { query, transaction } from '../config/db';
import { AppError } from '../utils/errorHandler';
import { sanitizeOptionalText, sanitizeRequiredText } from '../utils/sanitize';
import { ListingService } from './listingService';
import { deleteUploadUrls } from '../middleware/listingUpload';

export class PlatformService {
  static async listAnnouncements() {
    const result = await query<any>(
      `SELECT ar.*, pt.slug AS property_type_slug,
       COALESCE(json_agg(ari.url ORDER BY ari.sort_order) FILTER (WHERE ari.id IS NOT NULL), '[]') AS images
       FROM announcement_requests ar LEFT JOIN property_types pt ON pt.property_type_id = ar.property_type_id
       LEFT JOIN announcement_request_images ari ON ari.request_id = ar.request_id
       GROUP BY ar.request_id, pt.slug ORDER BY ar.created_at DESC`,
    );
    return result.rows;
  }
  static async createAnnouncement(data: {
    requesterId: number;
    propertyTypeSlug: 'apartment' | 'studio' | 'villa';
    rentalTerm: 'short_term' | 'long_term' | 'both';
    title: string;
    description: string;
    locationName: string; mapUrl: string; basePrice: number; pricingUnit: string;
    guestCapacity?: number; contactName: string; contactPhone: string; contactEmail: string;
    imageUrls: string[];
  }) {
    return transaction(async (client) => {
      const category = await client.query<{ category_id: number }>("SELECT category_id FROM categories WHERE slug='housing'");
      const propertyType = await client.query<{ property_type_id: number }>('SELECT property_type_id FROM property_types WHERE slug=$1 AND is_active=true', [data.propertyTypeSlug]);
      if (!category.rows[0] || !propertyType.rows[0]) throw new AppError(400, 'Unknown property type');
      const result = await client.query<any>(
        `INSERT INTO announcement_requests
        (requester_id, service_type, category_id, property_type_id, rental_term, title, description, address, map_url, base_price, pricing_unit, guest_capacity, contact_name, contact_phone, contact_email)
        VALUES ($1,'VACATION_RENTAL',$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
        [data.requesterId, category.rows[0].category_id, propertyType.rows[0].property_type_id, data.rentalTerm,
          sanitizeRequiredText(data.title, 'title'), sanitizeRequiredText(data.description, 'description'),
          sanitizeRequiredText(data.locationName, 'locationName'), data.mapUrl, data.basePrice, data.pricingUnit,
          data.guestCapacity || null, sanitizeRequiredText(data.contactName, 'contactName'),
          sanitizeRequiredText(data.contactPhone, 'contactPhone'), data.contactEmail.toLowerCase()],
      );
      for (const [index, url] of data.imageUrls.entries()) await client.query(
        'INSERT INTO announcement_request_images (request_id, url, sort_order) VALUES ($1,$2,$3)',
        [result.rows[0].request_id, url, index],
      );
      await client.query('INSERT INTO moderation_cases (entity_type, entity_id, due_at) VALUES (\'announcement\',$1,now()+interval \'24 hours\') ON CONFLICT DO NOTHING', [result.rows[0].request_id]);
      return { ...result.rows[0], propertyTypeSlug: data.propertyTypeSlug, images: data.imageUrls };
    });
  }
  static async reviewAnnouncement(
    requestId: number,
    reviewerId: number,
    reviewerRole: string,
    status: string,
    reason?: string,
  ) {
    if (reviewerRole !== 'ADMIN') throw new AppError(403, 'Administrator access required');
    const outcome = await transaction(async (client) => {
      const current = await client.query<any>(`SELECT ar.*, pt.slug AS property_type_slug
        FROM announcement_requests ar JOIN property_types pt ON pt.property_type_id=ar.property_type_id
        WHERE ar.request_id=$1 FOR UPDATE OF ar`, [requestId]);
      const row = current.rows[0];
      if (!row) throw new AppError(404, 'Publication request not found');
      const images = await client.query<{url:string}>('SELECT url FROM announcement_request_images WHERE request_id=$1 ORDER BY sort_order',[requestId]);
      row.images = images.rows.map(image => image.url);
      if (!['PENDING', 'ESCALATED'].includes(row.status))
        throw new AppError(409, 'Publication request has already received final review');
      let listingId: number | null = null;
      if (status === 'APPROVED') {
        const location = await client.query<{ location_id: number }>('INSERT INTO locations(name) VALUES ($1) RETURNING location_id', [row.address]);
        const listing = await client.query<{ listing_id: number }>(`INSERT INTO listings
          (provider_id,category_id,property_type_id,rental_term,location_id,title,description,base_price,pricing_unit,contact_name,contact_phone,contact_email,cover_image_url,service_type,guest_capacity,status,is_active,map_url,reviewed_by,reviewed_at)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'VACATION_RENTAL',$14,'approved',true,$15,$16,now()) RETURNING listing_id`,
          [row.requester_id,row.category_id,row.property_type_id,row.rental_term,location.rows[0].location_id,row.title,row.description,row.base_price,row.pricing_unit,row.contact_name,row.contact_phone,row.contact_email,row.images[0]||null,row.guest_capacity,row.map_url,reviewerId]);
        listingId = listing.rows[0].listing_id;
        for (const [index,url] of row.images.entries()) await client.query('INSERT INTO listing_images(listing_id,url,sort_order) VALUES ($1,$2,$3)',[listingId,url,index]);
      }
      await client.query('UPDATE announcement_requests SET status=$1,reviewed_by=$2,review_reason=$3,updated_at=now() WHERE request_id=$4',[status,reviewerId,sanitizeOptionalText(reason)||null,requestId]);
      await client.query('UPDATE moderation_cases SET status=\'decided\',updated_at=now() WHERE entity_type=\'announcement\' AND entity_id=$1',[requestId]);
      await client.query(
        'INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, reason) VALUES ($1,$2,$3,$4,$5)',
        [
          reviewerId,
          `announcement:${status.toLowerCase()}`,
          'announcement_request',
          requestId,
          sanitizeOptionalText(reason) || null,
        ],
      );
      if (status === 'REJECTED') await client.query('DELETE FROM announcement_requests WHERE request_id=$1',[requestId]);
      return { item: { requestId, status, listingId }, deleteUrls: status === 'REJECTED' ? row.images as string[] : [] };
    });
    await deleteUploadUrls(outcome.deleteUrls);
    return outcome.item;
  }
  static async toggleFavorite(userId: number, listingId: number) {
    return transaction(async (client) => {
      const listing = await client.query(
        'SELECT 1 FROM listings WHERE status = \'approved\' AND is_active = true AND listing_id = $1',
        [listingId],
      );
      if (!listing.rowCount) throw new AppError(404, 'Listing not found');
      const existing = await client.query(
        'DELETE FROM favorites WHERE user_id = $1 AND listing_id = $2 RETURNING listing_id',
        [userId, listingId],
      );
      if (existing.rowCount) return { saved: false, listingId };
      await client.query(
        'INSERT INTO favorites (user_id, listing_id) VALUES ($1,$2)',
        [userId, listingId],
      );
      return { saved: true, listingId };
    });
  }
  static async getFavorites(userId: number) {
    const result = await query<{ listing_id: number }>(
      'SELECT l.listing_id FROM favorites f JOIN listings l ON l.listing_id = f.listing_id WHERE f.user_id = $1 AND l.status = \'approved\' AND l.is_active = true ORDER BY f.created_at DESC',
      [userId],
    );
    const listings = await Promise.all(
      result.rows.map((row) =>
        ListingService.findById(row.listing_id, { publicOnly: true }),
      ),
    );
    return listings.filter((listing) => listing !== null);
  }
}
