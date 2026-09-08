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
           VALUES(?,?,?,?,?,?)
           ON DUPLICATE KEY UPDATE owner_id=LAST_INSERT_ID(owner_id),first_name=VALUES(first_name),last_name=VALUES(last_name),
             phone=VALUES(phone),email=COALESCE(VALUES(email),email),
             photo_url=COALESCE(VALUES(photo_url),photo_url),updated_at=now()`,
          [sanitizeRequiredText(data.firstName, 'firstName'), sanitizeRequiredText(data.lastName, 'lastName'), data.nationalIdCode.toUpperCase(), sanitizeRequiredText(data.phone, 'phone'), data.email || null, files.photoUrl],
        );
        const listing = await client.query<any>(
          `INSERT INTO listings(provider_id,owner_id,category_id,area_id,property_type_id,title,base_price,pricing_unit,
             contact_name,contact_phone,contact_email,status,is_active,service_type,rental_term,contract_number,
             contract_document_url,location_text,map_url,latitude,longitude,cover_image_url,submitted_at,reviewed_at,reviewed_by)
           VALUES(?,?,(SELECT category_id FROM categories WHERE slug='housing'),?,?,?,?,'night',?,?,?,
             'approved',true,'VACATION_RENTAL','short_term',?,?,?,?,?,?,?,now(),now(),?)
          `,
          [actorId, owner.insertId, data.areaId, data.propertyTypeId, sanitizeRequiredText(data.title, 'title'), data.nightlyPrice, `${sanitizeRequiredText(data.firstName, 'firstName')} ${sanitizeRequiredText(data.lastName, 'lastName')}`, sanitizeRequiredText(data.phone, 'phone'), data.email || null, data.contractNumber, files.contractUrl, sanitizeRequiredText(data.locationText, 'locationText'), sanitizeOptionalText(data.mapUrl) || null, data.latitude ?? null, data.longitude ?? null, files.imageUrls[0] || null, actorId],
        );
        if (!owner.insertId || !listing.insertId) throw new AppError(500, 'Property could not be created');
        for (let index = 0; index < files.imageUrls.length; index += 1) await client.query('INSERT INTO listing_images(listing_id,url,sort_order) VALUES(?,?,?)', [listing.insertId, files.imageUrls[index], index]);
        return { ownerId: owner.insertId, listingId: listing.insertId };
      });
      await invalidateCache('listings', 'categories');
      return ids;
    } catch (error: any) {
      if (error?.code === 'ER_DUP_ENTRY' || error?.errno === 1062) throw new AppError(409, 'This contract number is already registered');
      throw error;
    }
  }

  static async list(params: { search?: string; page: number; limit: number }) {
    const values: unknown[] = [];
    let where = '';
    if (params.search) {
      const search = `%${params.search}%`;
      values.push(search, search, search);
      where = `WHERE (CONCAT_WS(' ',o.first_name,o.last_name) LIKE ? OR o.national_id_code LIKE ?
        OR EXISTS(SELECT 1 FROM listings l WHERE l.owner_id=o.owner_id AND l.contract_number LIKE ?))`;
    }
    const count = await query<any>(`SELECT COUNT(*) AS total FROM property_owners o ${where}`, values);
    const result = await query<any>(
      `SELECT o.*,COUNT(l.listing_id) AS property_count FROM property_owners o LEFT JOIN listings l ON l.owner_id=o.owner_id
       ${where} GROUP BY o.owner_id ORDER BY o.created_at DESC LIMIT ? OFFSET ?`,
      [...values, params.limit, (params.page - 1) * params.limit],
    );
    const total = Number(count.rows[0]?.total || 0);
    return { items: result.rows.map(mapOwner), pagination: { total, page: params.page, limit: params.limit, totalPages: Math.ceil(total / params.limit) } };
  }

  static async get(id: number) {
    const owner = await query<any>('SELECT o.*,COUNT(l.listing_id) AS property_count FROM property_owners o LEFT JOIN listings l ON l.owner_id=o.owner_id WHERE o.owner_id=? GROUP BY o.owner_id', [id]);
    if (!owner.rows[0]) throw new AppError(404, 'Owner not found');
    const properties = await query<any>(
      `SELECT l.listing_id,l.title,l.base_price,l.contract_number,l.contract_document_url,l.location_text,
        l.map_url,l.latitude,l.longitude,l.status,l.is_active,l.cover_image_url,l.created_at,pt.name AS property_type
       FROM listings l LEFT JOIN property_types pt ON pt.property_type_id=l.property_type_id
       WHERE l.owner_id=? ORDER BY l.created_at DESC`, [id],
    );
    return { ...mapOwner(owner.rows[0]), properties: properties.rows.map(row => ({ listingId: row.listing_id, title: decodeStoredText(row.title), basePrice: Number(row.base_price), contractNumber: row.contract_number, contractDocumentUrl: row.contract_document_url, locationText: row.location_text ? decodeStoredText(row.location_text) : null, mapUrl: row.map_url, latitude: row.latitude === null ? null : Number(row.latitude), longitude: row.longitude === null ? null : Number(row.longitude), status: row.status, isActive: row.is_active, coverImageUrl: row.cover_image_url, propertyType: row.property_type, createdAt: row.created_at })) };
  }
}
