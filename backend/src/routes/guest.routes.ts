import { Router } from 'express';
import {
    getAllGuests,
    getGuestById,
    updateGuest,
    getGuestBookings,
} from '../controllers/guest.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All routes require authentication and admin role
router.use(authenticate, authorize('admin', 'staff'));

router.get('/', getAllGuests);
router.get('/:id', getGuestById);
router.put('/:id', updateGuest);
router.get('/:id/bookings', getGuestBookings);

export default router;
