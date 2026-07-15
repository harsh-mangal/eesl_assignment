import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';
import { authRouter } from '../modules/auth/auth.routes.js';
import { dashboardRouter } from '../modules/dashboard/dashboard.routes.js';
import { adminMemberRouter, memberRouter } from '../modules/members/member.routes.js';
import { qrRouter } from '../modules/qr/qr.routes.js';
import { rfidRouter } from '../modules/rfid/rfid.routes.js';
import { restaurantRouter, adminRestaurantRouter } from '../modules/restaurants/restaurant.routes.js';
import { roomRouter, adminRoomRouter } from '../modules/rooms/room.routes.js';
import { adminBookingRouter, bookingRouter } from '../modules/bookings/booking.routes.js';
import { eventRouter, adminEventRouter } from '../modules/events/event.routes.js';
import { paymentRouter, adminPaymentRouter } from '../modules/payments/payment.routes.js';
import { invoiceRouter, adminInvoiceRouter } from '../modules/invoices/invoice.routes.js';
import { notificationRouter, adminNotificationRouter } from '../modules/notifications/notification.routes.js';
import { feedbackRouter, adminFeedbackRouter } from '../modules/feedback/feedback.routes.js';
import { additionalServiceRouter } from '../modules/additional-services/additional-service.routes.js';
import { adminReportRouter } from '../modules/reports/report.routes.js';

export const apiRouter = Router();

const authLimiter = rateLimit({
  windowMs: env.API_RATE_LIMIT_WINDOW_MS,
  limit: env.AUTH_RATE_LIMIT_MAX,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { success: false, message: 'Too many failed login attempts. Please try again later.' },
});

apiRouter.use('/auth', authLimiter, authRouter);
apiRouter.use('/dashboard', dashboardRouter);
apiRouter.use('/member', memberRouter);
apiRouter.use('/admin/members', adminMemberRouter);
apiRouter.use('/admin/rfid', rfidRouter);
apiRouter.use('/admin/qr', qrRouter);

apiRouter.use('/restaurants', restaurantRouter);
apiRouter.use('/rooms', roomRouter);
apiRouter.use('/bookings', bookingRouter);
apiRouter.use('/admin/bookings', adminBookingRouter);
apiRouter.use('/events', eventRouter);
apiRouter.use('/payments', paymentRouter);
apiRouter.use('/invoices', invoiceRouter);
apiRouter.use('/notifications', notificationRouter);
apiRouter.use('/feedback', feedbackRouter);
apiRouter.use('/additional-services', additionalServiceRouter);
apiRouter.use('/admin/restaurants', adminRestaurantRouter);
apiRouter.use('/admin/rooms', adminRoomRouter);
apiRouter.use('/admin/events', adminEventRouter);
apiRouter.use('/admin/payments', adminPaymentRouter);
apiRouter.use('/admin/invoices', adminInvoiceRouter);
apiRouter.use('/admin/notifications', adminNotificationRouter);
apiRouter.use('/admin/feedback', adminFeedbackRouter);
apiRouter.use('/admin/reports', adminReportRouter);
