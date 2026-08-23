import { RequestHandler } from 'express';
import { UserService } from '../services/userService';
export const list: RequestHandler = async (_req, res, next) => {
  try {
    res.json({ items: await UserService.findAll() });
  } catch (error) {
    next(error);
  }
};
export const get: RequestHandler = async (req, res, next) => {
  try {
    const user = await UserService.findById(Number(req.params.id));
    if (!user)
      return res.status(404).json({ error: { message: 'User not found' } });
    res.json({ item: user });
  } catch (error) {
    next(error);
  }
};
