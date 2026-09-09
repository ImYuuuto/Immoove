import { Router } from 'express';
import listings from './listings';
import users from './users';
import bookings from './bookings';
import platform from './platform';
import authRoutes from './auth';
import profile from './profile';
import admin from './admin';
import legal from './legal';
import reviews from './reviews';
import owners from './owners';

// Create the main router that groups all application routes.
const router = Router();

router.use('/auth', authRoutes);
router.use('/legal', legal);
router.use('/profile', profile);
router.use('/admin', admin);

//This is the root of the APP
router.use('/', platform);

router.use('/listings', listings);
router.use('/users', users);
router.use('/bookings', bookings);
router.use('/reviews', reviews);
router.use('/owners', owners);

export default router;
