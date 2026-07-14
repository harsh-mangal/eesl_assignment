# Milestone 2 Manual Test Plan

## Setup

1. Start MySQL with `docker compose up -d`.
2. In `server`, run `npm install`, `npm run prisma:generate`, `npm run prisma:migrate`, `npm run prisma:seed`, then `npm run dev`.
3. Start the Admin Panel and mobile application using the README instructions.
4. Log in as `aarav@example.com / Member@123` and `admin@memberservices.test / Admin@123`.

## Restaurant flow

1. In the mobile application, open **Restaurant Booking** and select a future date.
2. Note a slot's remaining capacity.
3. Reserve two guests and verify a booking number and QR code are generated.
4. Refresh the Admin Panel's **Restaurants → Reservations** tab and verify the booking appears.
5. Confirm that the slot's booked capacity increased by two.
6. Cancel the booking from **My Bookings**.
7. Verify the booking becomes `CANCELLED` and the slot capacity is restored.
8. In Admin, deactivate the restaurant or close the slot and verify it cannot be booked on mobile.
9. Reduce slot capacity and verify it cannot be set below existing booked capacity.

## Room flow

1. In the mobile application, open **Room Booking** and search a future two-night date range.
2. Select an available room and confirm the calculated total equals nightly price × nights.
3. Book the room and verify it appears in Admin and **My Bookings**.
4. Search the same room and overlapping dates; it must no longer appear.
5. Search dates ending on the existing check-in date or starting on its check-out date; the room may appear because these ranges do not overlap.
6. Cancel the room booking and verify the room reappears for the original dates.
7. Mark an unbooked room as `MAINTENANCE` in Admin and verify it disappears from availability.
8. Attempt to mark a room with an active future booking unavailable; the backend must reject the change.
9. Search with guests above room capacity and verify the room is excluded.

## Security and negative cases

1. Log in as disabled member `MEM-1003 / Member@123`; login must be denied.
2. Call member booking endpoints with an admin token; access must be denied.
3. Try a past restaurant date, past room check-in, same-day room check-out, zero guests and excessive guests; validation must reject each request.
4. Submit two near-simultaneous bookings for the same final restaurant capacity or same room dates; only one may succeed.
