import { Router } from 'express';
import { authRouter } from '../modules/auth/auth.routes.js';
import { dashboardRouter } from '../modules/dashboard/dashboard.routes.js';
import { adminMemberRouter, memberRouter } from '../modules/members/member.routes.js';
import { qrRouter } from '../modules/qr/qr.routes.js';
import { rfidRouter } from '../modules/rfid/rfid.routes.js';
import { restaurantRouter, adminRestaurantRouter } from '../modules/restaurants/restaurant.routes.js';
import { roomRouter, adminRoomRouter } from '../modules/rooms/room.routes.js';
import { bookingRouter } from '../modules/bookings/booking.routes.js';

export const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/dashboard', dashboardRouter);
apiRouter.use('/member', memberRouter);
apiRouter.use('/admin/members', adminMemberRouter);
apiRouter.use('/admin/rfid', rfidRouter);
apiRouter.use('/admin/qr', qrRouter);

apiRouter.use('/restaurants', restaurantRouter);
apiRouter.use('/rooms', roomRouter);
apiRouter.use('/bookings', bookingRouter);
apiRouter.use('/admin/restaurants', adminRestaurantRouter);
apiRouter.use('/admin/rooms', adminRoomRouter);
