# Integrated Member Services Application

Production-style monorepo for the Full-Stack and React Native Developer Assignment.

## Applications

- `server` — Node.js, Express, TypeScript, Prisma and MySQL
- `admin` — React, TypeScript, Vite and Material UI
- `mobile` — React Native with Expo, TypeScript and React Navigation

## Milestones implemented

### Foundation and member identity

- Complete MySQL data model for members, membership, RFID, restaurants, rooms, events, bookings, invoices, payments, notifications, feedback, QR records and additional services
- Realistic seed dataset with one administrator and five members
- JWT authentication by email or Member ID
- Password hashing, disabled-account protection and role authorization
- Member dashboard, profile update, digital membership card and RFID status
- Admin dashboard, member management, RFID management and QR verification

### Restaurant booking

- Date-based restaurant and slot availability from MySQL
- Active restaurant and slot validation
- Available-capacity calculation
- Transactional capacity reduction during booking
- Capacity restoration after cancellation
- Active-membership enforcement
- Unique booking number and QR token generation
- Member booking history with reservation QR
- Admin restaurant CRUD, slot CRUD, capacity controls and reservation status management

### Room booking

- Check-in, check-out and guest-based availability search
- Room status and maintenance validation
- Guest-capacity validation
- Overlapping booking prevention using serializable transactions
- Number-of-nights and total-price calculation
- Booking cancellation that immediately restores date availability
- Member room-booking history
- Admin room CRUD, price/amenity/status controls, booked ranges and booking status management

## Prerequisites

- Node.js 20+
- Docker Desktop or MySQL 8+
- npm

## 1. Start MySQL

```bash
docker compose up -d
```

## 2. Backend

```bash
cd server
cp .env.example .env
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

Backend: `http://localhost:4001`  
Health check: `http://localhost:4001/health`

## 3. Admin Panel

```bash
cd admin
cp .env.example .env
npm install
npm run dev
```

Admin Panel: `http://localhost:5173`

## 4. Mobile App

```bash
cd mobile
cp .env.example .env
npm install
npm start
```

For an Android emulator:

```env
EXPO_PUBLIC_API_URL=http://10.0.2.2:4001/api
```

For a physical phone, use the Mac's LAN address, for example:

```env
EXPO_PUBLIC_API_URL=http://192.168.1.10:4001/api
```

## Demo credentials

### Administrator

- Email: `admin@memberservices.test`
- Password: `Admin@123`

### Active member

- Email: `aarav@example.com`
- Member ID: `MEM-1001`
- Password: `Member@123`

All seeded member accounts use `Member@123`. `MEM-1003` is intentionally disabled for negative login and booking tests.

## Main API routes added in Milestone 2

```text
GET    /api/restaurants?date=YYYY-MM-DD
POST   /api/restaurants/bookings/create
PATCH  /api/restaurants/bookings/:id/cancel
GET    /api/rooms/availability?checkInDate=YYYY-MM-DD&checkOutDate=YYYY-MM-DD&guestCount=2
POST   /api/rooms/bookings/create
PATCH  /api/rooms/bookings/:id/cancel
GET    /api/bookings

GET    /api/admin/restaurants
POST   /api/admin/restaurants
PATCH  /api/admin/restaurants/:id
POST   /api/admin/restaurants/:id/slots
PATCH  /api/admin/restaurants/slots/:id
GET    /api/admin/restaurants/bookings/list
PATCH  /api/admin/restaurants/bookings/:id/status

GET    /api/admin/rooms
POST   /api/admin/rooms
PATCH  /api/admin/rooms/:id
GET    /api/admin/rooms/bookings/list
PATCH  /api/admin/rooms/bookings/:id/status
```

## Android preview build

After configuring an Expo account:

```bash
npx eas-cli@latest init
npx eas-cli@latest build --platform android --profile preview
```

## Project structure

```text
integrated-member-services/
├── admin/
├── mobile/
├── server/
├── docker-compose.yml
├── BUILD_STATUS.md
└── README.md
```

## Next milestone

Event listing and filters, free/paid event booking, simulated payment, QR ticket generation, admin event management, event check-in and duplicate check-in prevention.
