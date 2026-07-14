import type { NavigatorScreenParams } from '@react-navigation/native';
import type { Room } from '../types/api';

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
};
