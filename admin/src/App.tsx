import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AdminLayout } from './layouts/AdminLayout';
import { ProtectedRoute } from './routes/ProtectedRoute';

const DashboardPage = lazy(() => import('./pages/DashboardPage').then((module) => ({ default: module.DashboardPage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then((module) => ({ default: module.LoginPage })));
const MembersPage = lazy(() => import('./pages/MembersPage').then((module) => ({ default: module.MembersPage })));
const RfidPage = lazy(() => import('./pages/RfidPage').then((module) => ({ default: module.RfidPage })));
const RestaurantsPage = lazy(() => import('./pages/RestaurantsPage').then((module) => ({ default: module.RestaurantsPage })));
const RoomsPage = lazy(() => import('./pages/RoomsPage').then((module) => ({ default: module.RoomsPage })));
const EventsPage = lazy(() => import('./pages/EventsPage').then((module) => ({ default: module.EventsPage })));
const BookingsPage = lazy(() => import('./pages/BookingsPage').then((module) => ({ default: module.BookingsPage })));
const PaymentsPage = lazy(() => import('./pages/PaymentsPage').then((module) => ({ default: module.PaymentsPage })));
const InvoicesPage = lazy(() => import('./pages/InvoicesPage').then((module) => ({ default: module.InvoicesPage })));
const QrVerificationPage = lazy(() => import('./pages/QrVerificationPage').then((module) => ({ default: module.QrVerificationPage })));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage').then((module) => ({ default: module.NotificationsPage })));
const FeedbackPage = lazy(() => import('./pages/FeedbackPage').then((module) => ({ default: module.FeedbackPage })));
const ReportsPage = lazy(() => import('./pages/ReportsPage').then((module) => ({ default: module.ReportsPage })));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage').then((module) => ({ default: module.PrivacyPolicyPage })));
const TermsAndConditionsPage = lazy(() => import('./pages/TermsAndConditionsPage').then((module) => ({ default: module.TermsAndConditionsPage })));
const AccountDeletionPage = lazy(() => import('./pages/AccountDeletionPage').then((module) => ({ default: module.AccountDeletionPage })));

function RouteLoader() {
  return (
    <div style={{ minHeight: 320, display: 'grid', placeItems: 'center', color: '#667085', fontFamily: 'sans-serif' }}>
      Loading module…
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<RouteLoader />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="/terms-and-conditions" element={<TermsAndConditionsPage />} />
        <Route path="/account-deletion" element={<AccountDeletionPage />} />
        <Route
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="members" element={<MembersPage />} />
          <Route path="rfid" element={<RfidPage />} />
          <Route path="restaurants" element={<RestaurantsPage />} />
          <Route path="rooms" element={<RoomsPage />} />
          <Route path="events" element={<EventsPage />} />
          <Route path="bookings" element={<BookingsPage />} />
          <Route path="invoices" element={<InvoicesPage />} />
          <Route path="payments" element={<PaymentsPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="feedback" element={<FeedbackPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="qr-verification" element={<QrVerificationPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
