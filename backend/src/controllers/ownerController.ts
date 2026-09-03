import type { RequestHandler } from 'express';
import { OwnerService } from '../services/ownerService';
import { ownerIdSchema, ownerPropertySchema, ownerQuerySchema } from '../validators/ownerValidators';
import { storeOwnerFiles } from '../middleware/ownerUpload';
import { AppError } from '../utils/errorHandler';
import { deleteUploadUrls, processListingUploads } from '../middleware/listingUpload';

export const list: RequestHandler = async (req, res, next) => { try { res.json(await OwnerService.list(ownerQuerySchema.parse(req.query))); } catch (error) { next(error); } };
export const get: RequestHandler = async (req, res, next) => { try { res.json({ item: await OwnerService.get(ownerIdSchema.parse(req.params).id) }); } catch (error) { next(error); } };
export const createProperty: RequestHandler = async (req, res, next) => {
  let imageUrls: string[] = [];
  try {
    const files = req.files as Record<string, Express.Multer.File[]> | undefined;
    const data = ownerPropertySchema.parse(req.body);
    if (!files?.contractDocument?.[0]) throw new AppError(400, 'Contract document is required');
    if (!files?.listingPhotos?.length) throw new AppError(400, 'At least one listing photo is required');
    imageUrls = await processListingUploads(files.listingPhotos);
    const stored = await storeOwnerFiles({ ownerPhoto: files?.ownerPhoto?.[0], contractDocument: files?.contractDocument?.[0] });
    const result = await OwnerService.createProperty(data, req.user!.userId, { ...stored, imageUrls });
    res.status(201).json({ item: result });
  } catch (error) { if (imageUrls.length) await deleteUploadUrls(imageUrls); next(error); }
};
