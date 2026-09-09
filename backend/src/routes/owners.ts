import { Router } from 'express';
import * as controller from '../controllers/ownerController';
import { auth, requireAdmin } from '../middleware/auth';
import { ownerDocumentsUpload } from '../middleware/ownerUpload';
const router = Router();

//Admin is required for access to all operations in this router 
router.use(auth, requireAdmin);

//Get owners list
router.get('/', controller.list);
//get infos about specific owner
router.get('/:id', controller.get);
/**
 * Create a property for an owner 
 */
router.post('/property', ownerDocumentsUpload, controller.createProperty);
export default router;
