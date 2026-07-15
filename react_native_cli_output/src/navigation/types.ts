import type { NavigatorScreenParams } from '@react-navigation/native';
import type { Event, EventBookingResult, Invoice, InvoicePaymentResult, Room, ServiceType } from '../types/api';

export type MainTabParamList = {
  Home: undefined;
  Bookings: undefined;
  Events: undefined;
  Notifications: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  MembershipCard: undefined;
  Invoices: undefined;
  InvoiceDetails: { invoiceId: string };
  InvoicePayment: { invoice: Invoice };
  PaymentReceipt: { result: InvoicePaymentResult };
  PaymentHistory: undefined;
  NotificationDetails: { notificationId: string };
  BookingDetails: { type: ServiceType; bookingId: string };
  Feedback: { serviceType: ServiceType; bookingId: string; bookingNumber: string; serviceName: string };
  LibraryAccount: undefined;
  RestaurantList: undefined;
  RestaurantBooking: {
    restaurantId: string;
    restaurantName: string;
    slotId: string;
    date: string;
    startTime: string;
    endTime: string;
    availableCapacity: number;
  };
  RoomList: undefined;
  RoomBooking: {
    roomId: string;
    checkInDate: string;
    checkOutDate: string;
    guestCount: number;
    room: Room;
  };
  EventDetails: { event: Event };
  EventTicket: { result: EventBookingResult };
};
