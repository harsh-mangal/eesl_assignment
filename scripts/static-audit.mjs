#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const checks = [];
const failures = [];

function record(label, ok, detail = '') {
  checks.push({ label, ok, detail });
  if (!ok) failures.push(`${label}${detail ? `: ${detail}` : ''}`);
}

function exists(relative) {
  const ok = fs.existsSync(path.join(root, relative));
  record(`File exists: ${relative}`, ok);
  return ok;
}

function contains(relative, needles, label = relative) {
  const file = path.join(root, relative);
  const source = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  const missing = needles.filter((needle) => !source.includes(needle));
  record(label, missing.length === 0, missing.length ? `missing ${missing.join(', ')}` : '');
}

const requiredFiles = [
  'server/prisma/schema.prisma',
  'server/prisma/seed.ts',
  'server/prisma/migrations/migration_lock.toml',
  'server/prisma/migrations/20260715000000_initial/migration.sql',
  'server/src/modules/auth/auth.routes.ts',
  'server/src/modules/members/member.routes.ts',
  'server/src/modules/rfid/rfid.routes.ts',
  'server/src/modules/restaurants/restaurant.routes.ts',
  'server/src/modules/rooms/room.routes.ts',
  'server/src/modules/events/event.routes.ts',
  'server/src/modules/bookings/booking.routes.ts',
  'server/src/modules/invoices/invoice.routes.ts',
  'server/src/modules/payments/payment.routes.ts',
  'server/src/modules/notifications/notification.routes.ts',
  'server/src/modules/feedback/feedback.routes.ts',
  'server/src/modules/additional-services/additional-service.routes.ts',
  'server/src/modules/qr/qr.routes.ts',
  'server/src/modules/reports/report.routes.ts',
  'admin/src/pages/DashboardPage.tsx',
  'admin/src/pages/MembersPage.tsx',
  'admin/src/pages/RfidPage.tsx',
  'admin/src/pages/BookingsPage.tsx',
  'admin/src/pages/RestaurantsPage.tsx',
  'admin/src/pages/RoomsPage.tsx',
  'admin/src/pages/EventsPage.tsx',
  'admin/src/pages/InvoicesPage.tsx',
  'admin/src/pages/PaymentsPage.tsx',
  'admin/src/pages/NotificationsPage.tsx',
  'admin/src/pages/FeedbackPage.tsx',
  'admin/src/pages/QrVerificationPage.tsx',
  'admin/src/pages/ReportsPage.tsx',
  'mobile/src/screens/LoginScreen.tsx',
  'mobile/src/screens/HomeScreen.tsx',
  'mobile/src/screens/ProfileScreen.tsx',
  'mobile/src/screens/MembershipCardScreen.tsx',
  'mobile/src/screens/InvoicesScreen.tsx',
  'mobile/src/screens/RestaurantListScreen.tsx',
  'mobile/src/screens/RoomListScreen.tsx',
  'mobile/src/screens/EventsScreen.tsx',
  'mobile/src/screens/MyBookingsScreen.tsx',
  'mobile/src/screens/BookingDetailsScreen.tsx',
  'mobile/src/screens/NotificationsScreen.tsx',
  'mobile/src/screens/FeedbackScreen.tsx',
  'mobile/src/screens/LibraryAccountScreen.tsx',
  'mobile/eas.json',
  'server/Dockerfile',
  'admin/Dockerfile',
  'README.md',
  'DEPLOYMENT.md',
  'APK_BUILD.md',
];
requiredFiles.forEach(exists);

contains('server/src/routes/index.ts', [
  "apiRouter.use('/auth'",
  "apiRouter.use('/admin/bookings'",
  "apiRouter.use('/admin/reports'",
  "apiRouter.use('/additional-services'",
], 'Backend module mounting');
contains('server/src/middleware/auth.ts', ['verifyAccessToken', 'AccountStatus.ACTIVE'], 'JWT and disabled-account enforcement');
contains('server/src/modules/bookings/booking.service.ts', ['getOwnBookingDetail', 'listAdminBookings', 'updateAdminBookingStatus'], 'Booking detail and consolidated administration');
contains('server/src/modules/restaurants/restaurant.service.ts', ['bookedCapacity: { increment:', 'bookedCapacity: { decrement:'], 'Restaurant capacity mutation/restoration');
contains('server/src/modules/rooms/room.service.ts', ['checkInDate: { lt: checkOutDate }', 'checkOutDate: { gt: checkInDate }'], 'Room overlap prevention');
contains('server/src/modules/qr/qr.service.ts', ['status: QrStatus.USED', 'checkedInAt: null'], 'One-time event check-in');
contains('server/src/modules/invoices/invoice.service.ts', ['InvoiceStatus.PAID', 'transactionId'], 'Invoice payment transition');
contains('server/src/modules/feedback/feedback.service.ts', ['BookingStatus.COMPLETED', 'Feedback has already been submitted'], 'Completed-only duplicate-safe feedback');
contains('admin/src/pages/DashboardPage.tsx', ['Active Members', 'Blocked RFID Cards', 'Available Restaurant Slots', 'Total Payment Amount', 'Average Feedback Rating'], 'All mandatory dashboard statistics visible');
contains('admin/src/pages/MembersPage.tsx', ['Add member', 'Deactivate', 'Member profile', 'Payments'], 'Full member management interface');
contains('admin/src/pages/RfidPage.tsx', ['Verify RFID reference', 'Reference number', 'Expiry date'], 'RFID assignment, expiry and verification interface');
contains('admin/src/pages/ReportsPage.tsx', ['CSV', 'PDF'], 'CSV and PDF report exports');
contains('mobile/src/navigation/AppNavigator.tsx', ['BookingDetails', 'MembershipCard', 'InvoicePayment', 'LibraryAccount'], 'Mandatory mobile stack screens');
contains('mobile/src/screens/MyBookingsScreen.tsx', ['View booking details', 'Cancel booking?', 'Rate this experience'], 'Booking details, cancellation and feedback actions');
contains('mobile/app.json', ['"package"', '"splash"', 'expo-image-picker'], 'Android identity, splash and image permissions');
contains('mobile/eas.json', ['"buildType": "apk"', '"buildType": "app-bundle"'], 'APK and AAB EAS profiles');

const schema = fs.readFileSync(path.join(root, 'server/prisma/schema.prisma'), 'utf8');
const migration = fs.readFileSync(path.join(root, 'server/prisma/migrations/20260715000000_initial/migration.sql'), 'utf8');
const modelCount = [...schema.matchAll(/^model\s+/gm)].length;
const tableCount = [...migration.matchAll(/^CREATE TABLE /gm)].length;
record('Migration table count matches Prisma models', modelCount === tableCount, `${modelCount} models / ${tableCount} tables`);
record('Migration contains foreign keys', (migration.match(/FOREIGN KEY/g) || []).length >= 15, `${(migration.match(/FOREIGN KEY/g) || []).length} foreign keys`);

const seed = fs.readFileSync(path.join(root, 'server/prisma/seed.ts'), 'utf8');
record('Seed includes one administrator', seed.includes("admin@memberservices.test"));
record('Seed includes five members', (seed.match(/memberCode: 'MEM-100/g) || []).length === 5);
record('Seed includes two restaurants', (seed.match(/name: 'The Garden Table'|name: 'Azure Rooftop'/g) || []).length === 2);
record('Seed includes five rooms', (seed.match(/\['[123]\d\d',/g) || []).length === 5);
record('Seed includes at least five upcoming events', (seed.match(/\['[^']+', '[^']+', \d+, '\d\d:\d\d'/g) || []).length >= 5);
record('Seed includes historical completed bookings', seed.includes('historicalRestaurantSlot') && seed.includes('historicalEvent') && seed.includes('atMidnight(-40)'));
record('Seed includes at least two invoices per member', seed.includes('unpaidInvoice') && seed.includes('paidInvoice'));
record('Seed includes at least five notifications', (seed.match(/title: '/g) || []).length >= 5);
record('Seed includes at least three feedback records', (seed.match(/serviceType: ServiceType\./g) || []).length >= 3);

const navigator = fs.readFileSync(path.join(root, 'mobile/src/navigation/AppNavigator.tsx'), 'utf8');
record('No placeholder screen is mounted', !navigator.includes('ModulePlaceholderScreen'));

console.log(`\nAssignment static audit: ${checks.filter((item) => item.ok).length}/${checks.length} checks passed.`);
for (const check of checks) console.log(`${check.ok ? 'PASS' : 'FAIL'}  ${check.label}${check.detail ? ` (${check.detail})` : ''}`);
if (failures.length) {
  console.error(`\n${failures.length} audit check(s) failed.`);
  process.exit(1);
}
