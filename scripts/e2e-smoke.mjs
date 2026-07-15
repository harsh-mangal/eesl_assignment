#!/usr/bin/env node
import process from 'node:process';

const serverBase = (process.env.SERVER_BASE_URL || 'http://localhost:4001').replace(/\/$/, '');
const apiBase = `${serverBase}/api`;
const memberIdentifier = process.env.MEMBER_IDENTIFIER || 'MEM-1001';
const memberPassword = process.env.MEMBER_PASSWORD || 'Member@123';
const adminIdentifier = process.env.ADMIN_IDENTIFIER || 'admin@memberservices.test';
const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';

async function request(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { 'content-type': 'application/json', ...(options.headers || {}) },
  });
  const text = await response.text();
  let body;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  if (!response.ok) throw new Error(`${options.method || 'GET'} ${url} -> ${response.status}: ${typeof body === 'string' ? body : JSON.stringify(body)}`);
  return body;
}

function check(label, condition) {
  if (!condition) throw new Error(`Smoke assertion failed: ${label}`);
  console.log(`PASS  ${label}`);
}

async function login(identifier, password) {
  const body = await request(`${apiBase}/auth/login`, {
    method: 'POST',
    body: JSON.stringify({ identifier, password }),
  });
  check(`Login works for ${identifier}`, Boolean(body?.data?.accessToken));
  return body.data.accessToken;
}

async function authed(path, token) {
  return request(`${apiBase}${path}`, { headers: { authorization: `Bearer ${token}` } });
}

const today = new Date();
const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
const dayAfter = new Date(today); dayAfter.setDate(today.getDate() + 2);
const dateKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

console.log(`Running read-only smoke tests against ${serverBase}`);
const health = await request(`${serverBase}/health`);
check('Health endpoint', health?.success === true);
const ready = await request(`${serverBase}/ready`);
check('Database readiness endpoint', ready?.database === 'ready');

const memberToken = await login(memberIdentifier, memberPassword);
const adminToken = await login(adminIdentifier, adminPassword);

const memberMe = await authed('/auth/me', memberToken);
check('Member role is protected', memberMe?.data?.role === 'MEMBER');
const dashboard = await authed('/dashboard/member', memberToken);
check('Member dashboard is database-driven', dashboard?.data?.summary && typeof dashboard.data.summary.upcomingBookings === 'number');
const profile = await authed('/member/profile', memberToken);
check('Member profile loads', Boolean(profile?.data?.memberCode));
const card = await authed('/member/membership-card', memberToken);
check('Membership QR loads', Boolean(card?.data?.qrToken));
const invoices = await authed('/invoices?filter=ALL&page=1&limit=20', memberToken);
check('Invoices load', Array.isArray(invoices?.data?.items));
const bookings = await authed('/bookings', memberToken);
check('Booking history includes all service buckets', ['restaurant', 'room', 'event'].every((key) => Array.isArray(bookings?.data?.[key])));
const events = await authed('/events?filter=UPCOMING', memberToken);
check('Upcoming events load', Array.isArray(events?.data?.items));
const restaurants = await authed(`/restaurants?date=${dateKey(tomorrow)}`, memberToken);
check('Restaurant availability loads', Array.isArray(restaurants?.data?.items));
const rooms = await authed(`/rooms/availability?checkInDate=${dateKey(tomorrow)}&checkOutDate=${dateKey(dayAfter)}&guestCount=1`, memberToken);
check('Room availability loads', Array.isArray(rooms?.data?.items));
const notifications = await authed('/notifications?page=1&limit=20', memberToken);
check('Notifications load', Array.isArray(notifications?.data?.items));
const library = await authed('/additional-services/LIBRARY', memberToken);
check('Additional service loads', library?.data?.serviceType === 'LIBRARY');

const adminDashboard = await authed('/dashboard/admin', adminToken);
check('Admin dashboard exposes required statistics', ['totalMembers', 'activeMembers', 'availableRestaurantSlots', 'totalPaymentAmount', 'averageFeedbackRating'].every((key) => key in adminDashboard.data.statistics));
const members = await authed('/admin/members?page=1&limit=20', adminToken);
check('Admin members load', Array.isArray(members?.data?.items));
const adminBookings = await authed('/admin/bookings?page=1&limit=20', adminToken);
check('Consolidated Admin bookings load', Array.isArray(adminBookings?.data?.items));
const reports = await authed('/admin/reports/MEMBERS', adminToken);
check('Reports use database data', Array.isArray(reports?.data?.rows));

console.log('\nRead-only end-to-end smoke test passed.');
