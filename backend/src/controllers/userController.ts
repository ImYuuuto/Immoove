import { RequestHandler } from 'express';
import { UserService } from '../services/userService';
import { userIdSchema, userQuerySchema, userRoleSchema, userStatusSchema } from '../validators/userValidators';
export const list: RequestHandler = async (req, res, next) => {
  try {
    res.json(await UserService.findAll(userQuerySchema.parse(req.query)));
  } catch (error) {
    next(error);
  }
};
export const get: RequestHandler = async (req, res, next) => {
  try {
    const user = await UserService.findById(userIdSchema.parse(req.params).id);
    if (!user)
      return res.status(404).json({ error: { message: 'User not found' } });
    res.json({ item: user });
  } catch (error) {
    next(error);
  }
};
export const setRole: RequestHandler = async (req, res, next) => {
  try {
    const { id } = userIdSchema.parse(req.params);
    const { role } = userRoleSchema.parse(req.body);
    res.json({ item: await UserService.setRole(id, role, req.user!.userId, req.user!.role) });
  } catch (error) {
    next(error);
  }
};
export const setStatus: RequestHandler = async (req, res, next) => {
  try {
    const { id } = userIdSchema.parse(req.params);
    const { status, reason } = userStatusSchema.parse(req.body);
    res.json({ item: await UserService.setStatus(id, status, req.user!.userId, req.user!.role, reason) });
  } catch (error) { next(error); }
};
