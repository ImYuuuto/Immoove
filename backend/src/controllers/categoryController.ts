import { RequestHandler } from 'express';
import { CategoryService } from '../services/categoryService';
import {
  categoryListingsQuerySchema,
  categorySlugSchema,
} from '../validators/categoryValidators';

export const list: RequestHandler = async (_req, res, next) => {
  try {
    res.json({ items: await CategoryService.list() });
  } catch (error) {
    next(error);
  }
};

export const listings: RequestHandler = async (req, res, next) => {
  try {
    const { slug } = categorySlugSchema.parse(req.params);
    const { page, limit } = categoryListingsQuerySchema.parse(req.query);
    res.json(await CategoryService.listings(slug, page, limit));
  } catch (error) {
    next(error);
  }
};
