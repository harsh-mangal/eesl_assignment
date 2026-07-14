# Build Status — Milestone 2

## Implemented

### Backend foundation

- Express + TypeScript modular architecture
- Prisma + MySQL schema for all assignment domains
- Full initial seed dataset
- JWT login by email or Member ID
- Password hashing and disabled-account handling
- Role authorization
- Centralized Zod validation and error handling
- Serializable transaction retry utility
- Active-membership booking guard

### Membership and RFID

- Member dashboard
- Member profile read/update
- Digital membership card and QR token
- Admin member list/create/update
- RFID list/update/verification
- Membership, restaurant and event QR verification
- Duplicate event check-in prevention service

### Restaurant module

- Member restaurant list by date
- Date-based slots from MySQL
- Live remaining-capacity calculation
- Active restaurant and slot checks
- Past-date and guest-count validation
- Atomic capacity reduction during reservation
- Unique booking number and QR generation
- Member cancellation and capacity restoration
- Admin restaurant create/edit/activate/deactivate
- Admin slot create/edit/capacity/availability controls
- Admin reservation list and status updates

### Room module

- Availability search by check-in, check-out and guest count
- Available/unavailable/maintenance checks
- Room-capacity validation
- Overlap-safe room booking
- Night and total calculations
- Member cancellation and availability restoration
- Admin room create/edit/status/price/capacity/amenities
- Admin room-booking list and status updates

### Admin Panel

- Login and persistent protected session
- Responsive navigation
- Live dashboard statistics and two charts
- Member and RFID management
- Restaurant cards, CRUD dialog and slot table
- Slot capacity and availability editing
- Restaurant reservation management
- Room cards and CRUD dialog
- Upcoming booked ranges
- Room-booking management

### Mobile

- Splash/session gate and member login
- Database-driven dashboard and profile
- Digital membership card and RFID status
- Restaurant date selection and live slots
- Guest selector and reservation confirmation
- Restaurant booking QR in booking history
- Room date-range and guest search
- Available-room cards with calculated totals
- Room booking confirmation
- Restaurant and room cancellation
- Booking history tabs for restaurant, room and seeded event bookings

## Not yet implemented

- Event catalogue, filters and event-booking UI
- Paid event simulation and payment records
- Invoice list, payment simulation and receipt
- Notification read/unread APIs and screens
- Feedback submission and management
- Additional-service mobile screen
- Event, invoice, payment, notification and feedback Admin modules
- Reports and CSV/PDF/Excel exports
- Image upload service
- Automated integration tests
- Cloud deployment and final Android APK

Do not present the remaining modules as complete in a final assignment submission.
