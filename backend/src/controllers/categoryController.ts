import { Request, Response, NextFunction } from "express";
import { CategoryService } from "../services/categoryService.js";

export class CategoryController {
  static async getAll(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categories = await CategoryService.getAll();
      res.json(categories);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categoryId = Number(req.params.id);
      const category = await CategoryService.getById(categoryId);

      if (!category) {
        res.status(404).json({ error: "Category not found" });
        return;
      }

      res.json(category);
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, slug, description } = req.body;
      const category = await CategoryService.create({ name, slug, description });
      res.status(201).json(category);
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categoryId = Number(req.params.id);
      const category = await CategoryService.update(categoryId, req.body);
      res.json(category);
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categoryId = Number(req.params.id);
      await CategoryService.delete(categoryId);
      res.json({ message: "Category deleted" });
    } catch (error) {
      next(error);
    }
  }
}