import { query, transaction } from '../config/db';
import { invalidateCache } from '../config/cache';
import { AppError } from '../utils/errorHandler';
import { decodeStoredText, sanitizeOptionalText, sanitizeRequiredText } from '../utils/sanitize';

const mapOwner = (row: any) => ({ ownerId: row.owner_id, firstName: decodeStoredText(row.first_name), lastName: decodeStoredText(row.last_name), nationalIdCode: row.national_id_code, phone: decodeStoredText(row.phone), email: row.email, photoUrl: row.photo_url, createdAt: row.created_at, propertyCount: Number(row.property_count || 0) });

export class OwnerService {
  static async createProperty(data: any, actorId: number, files: { photoUrl: string | null; contractUrl: string | null; imageUrls: string[] }) {
    try {
      const ids = await transaction(async client => {
        const owner = await client.query<any>(
          `INSERT INTO property_owners(first_name,last_name,national_id_code,phone,email,photo_url)
           VALUES($1,$2,$3,$4,$5,$6)
           ON CONFLICT(national_id_code) DO UPDATE SET first_name=EXCLUDED.first_name,last_name=EXCLUDED.last_name,
             phone=EXCLUDED.phone,email=COALESCE(EXCLUDED.email,property_owners.email),
             photo_url=COALESCE(EXCLUDED.photo_url,property_owners.photo_url),updated_at=now()
           RETURNING owner_id`,
          [sanitizeRequiredText(data.firstName, 'firstName'), sanitizeRequiredText(data.lastName, 'lastName'), data.nationalIdCode.toUpperCase(), sanitizeRequiredText(data.phone, 'phone'), data.email || null, files.photoUrl],
        );
        const listing = await client.query<any>(
          `INSERT INTO listings(provider_id,owner_id,category_id,area_id,property_type_id,title,base_price,pricing_unit,
             contact_name,contact_phone,contact_email,status,is_active,service_type,rental_term,contract_number,
             contract_document_url,location_text,map_url,latitude,longitude,cover_image_url,submitted_at,reviewed_at,reviewed_by)
           VALUES($1,$2,(SELECT category_id FROM categories WHERE slug='housing'),$3,$4,$5,$6,'night',$7,$8,$9,
             'approved',true,'VACATION_RENTAL','short_term',$10,$11,$12,$13,$14,$15,$16,now(),now(),$1)
           RETURNING listing_id`,
          [actorId, owner.rows[0].owner_id, data.areaId, data.propertyTypeId, sanitizeRequiredText(data.title, 'title'), data.nightlyPrice, `${sanitizeRequiredText(data.firstName, 'firstName')} ${sanitizeRequiredText(data.lastName, 'lastName')}`, sanitizeRequiredText(data.phone, 'phone'), data.email || null, data.contractNumber, files.contractUrl, sanitizeRequiredText(data.locationText, 'locationText'), sanitizeOptionalText(data.mapUrl) || null, data.latitude ?? null, data.longitude ?? null, files.imageUrls[0]],
        );
        for (let index = 0; index < files.imageUrls.length; index += 1) await client.query('INSERT INTO listing_images(listing_id,image_url,sort_order) VALUES($1,$2,$3)', [listing.rows[0].listing_id, files.imageUrls[index], index]);
        return { ownerId: owner.rows[0].owner_id, listingId: listing.rows[0].listing_id };
      });
      await invalidateCache('listings', 'categories');
      return ids;
    } catch (error: any) {
      if (error?.code === '23505') throw new AppError(409, 'This contract number is already registered');
      throw error;
    }
  }

  static async list(params: { search?: string; page: number; limit: number }) {
    const values: unknown[] = [];
    let where = '';
    if (params.search) {
      values.push(`%${params.search}%`);
      where = `WHERE (o.first_name || ' ' || o.last_name ILIKE $1 OR o.national_id_code ILIKE $1
        OR EXISTS(SELECT 1 FROM listings l WHERE l.owner_id=o.owner_id AND l.contract_number ILIKE $1))`;
    }
    const count = await query<any>(`SELECT COUNT(*)::int AS total FROM property_owners o ${where}`, values);
    const result = await query<any>(
      `SELECT o.*,COUNT(l.listing_id)::int AS property_count FROM property_owners o LEFT JOIN listings l ON l.owner_id=o.owner_id
       ${where} GROUP BY o.owner_id ORDER BY o.created_at DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
      [...values, params.limit, (params.page - 1) * params.limit],
    );
    const total = Number(count.rows[0]?.total || 0);
    return { items: result.rows.map(mapOwner), pagination: { total, page: params.page, limit: params.limit, totalPages: Math.ceil(total / params.limit) } };
  }

  static async get(id: number) {
    const owner = await query<any>(`SELECT o.*,COUNT(l.listing_id)::int AS property_count FROM property_owners o LEFT JOIN listings l ON l.owner_id=o.owner_id WHERE o.owner_id=$1 GROUP BY o.owner_id`, [id]);
    if (!owner.rows[0]) throw new AppError(404, 'Owner not found');
    const properties = await query<any>(
      `SELECT l.listing_id,l.title,l.base_price,l.contract_number,l.contract_document_url,l.location_text,
        l.map_url,l.latitude,l.longitude,l.status,l.is_active,l.cover_image_url,l.created_at,pt.name AS property_type
       FROM listings l LEFT JOIN property_types pt ON pt.property_type_id=l.property_type_id
       WHERE l.owner_id=$1 ORDER BY l.created_at DESC`, [id],
    );
    return { ...mapOwner(owner.rows[0]), properties: properties.rows.map(row => ({ listingId: row.listing_id, title: decodeStoredText(row.title), basePrice: Number(row.base_price), contractNumber: row.contract_number, contractDocumentUrl: row.contract_document_url, locationText: row.location_text ? decodeStoredText(row.location_text) : null, mapUrl: row.map_url, latitude: row.latitude === null ? null : Number(row.latitude), longitude: row.longitude === null ? null : Number(row.longitude), status: row.status, isActive: row.is_active, coverImageUrl: row.cover_image_url, propertyType: row.property_type, createdAt: row.created_at })) };
  }
}
