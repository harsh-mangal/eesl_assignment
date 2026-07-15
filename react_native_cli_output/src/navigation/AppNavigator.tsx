import Ionicons from 'react-native-vector-icons/Ionicons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { ComponentProps } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { LoadingView } from '../components/LoadingView';
import { HomeScreen } from '../screens/HomeScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { MembershipCardScreen } from '../screens/MembershipCardScreen';
import { RestaurantListScreen } from '../screens/RestaurantListScreen';
import { RestaurantBookingScreen } from '../screens/RestaurantBookingScreen';
import { RoomListScreen } from '../screens/RoomListScreen';
import { RoomBookingScreen } from '../screens/RoomBookingScreen';
import { MyBookingsScreen } from '../screens/MyBookingsScreen';
import { EventsScreen } from '../screens/EventsScreen';
import { EventDetailsScreen } from '../screens/EventDetailsScreen';
import { EventTicketScreen } from '../screens/EventTicketScreen';
import { InvoicesScreen } from '../screens/InvoicesScreen';
import { InvoiceDetailsScreen } from '../screens/InvoiceDetailsScreen';
import { InvoicePaymentScreen } from '../screens/InvoicePaymentScreen';
import { PaymentReceiptScreen } from '../screens/PaymentReceiptScreen';
import { PaymentHistoryScreen } from '../screens/PaymentHistoryScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { NotificationDetailsScreen } from '../screens/NotificationDetailsScreen';
import { BookingDetailsScreen } from '../screens/BookingDetailsScreen';
import { FeedbackScreen } from '../screens/FeedbackScreen';
import { LibraryAccountScreen } from '../screens/LibraryAccountScreen';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';
import type { ApiResponse, MemberSession } from '../types/api';
import type { MainTabParamList, RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<{ Login: undefined }>();
const Tabs = createBottomTabNavigator<MainTabParamList>();

type IconName = ComponentProps<typeof Ionicons>['name'];

const icons: Record<keyof MainTabParamList, { active: IconName; inactive: IconName }> = {
  Home: { active: 'home', inactive: 'home-outline' },
  Bookings: { active: 'calendar', inactive: 'calendar-outline' },
  Events: { active: 'ticket', inactive: 'ticket-outline' },
  Notifications: { active: 'notifications', inactive: 'notifications-outline' },
  Profile: { active: 'person', inactive: 'person-outline' },
};

function MainTabs() {
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, 7);

  return (
    <Tabs.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#175CD3',
        tabBarInactiveTintColor: '#667085',
        tabBarStyle: { height: 59 + bottomPadding, paddingTop: 7, paddingBottom: bottomPadding, borderTopColor: '#EAECF0' },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700' },
        tabBarBadge: route.name === 'Notifications' && unreadCount > 0 ? (unreadCount > 99 ? '99+' : unreadCount) : undefined,
        tabBarBadgeStyle: { backgroundColor: '#D92D20', color: '#FFFFFF', fontSize: 9, fontWeight: '800' },
        tabBarIcon: ({ focused, color, size }) => (
          <Ionicons
            name={focused ? icons[route.name].active : icons[route.name].inactive}
            size={size}
            color={color}
          />
        ),
      })}
    >
      <Tabs.Screen name="Home" component={HomeScreen} />
      <Tabs.Screen name="Bookings" component={MyBookingsScreen} />
      <Tabs.Screen name="Events" component={EventsScreen} />
      <Tabs.Screen name="Notifications" component={NotificationsScreen} />
      <Tabs.Screen name="Profile" component={ProfileScreen} />
    </Tabs.Navigator>
  );
}

export function AppNavigator() {
  const token = useAuthStore((state) => state.token);
  const hydrated = useAuthStore((state) => state.hydrated);
  const clearSession = useAuthStore((state) => state.clearSession);
  const setSession = useAuthStore((state) => state.setSession);
  const setUnreadCount = useNotificationStore((state) => state.setUnreadCount);
  const resetNotificationCount = useNotificationStore((state) => state.reset);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    if (!hydrated) return;
    if (!token) {
      resetNotificationCount();
      setCheckingSession(false);
      return;
    }

    setCheckingSession(true);
    let active = true;
    api
      .get<ApiResponse<MemberSession>>('/auth/me')
      .then((response) => {
        if (!active) return;
        if (response.data.data.role !== 'MEMBER') {
          clearSession();
          return;
        }
        setSession(token, response.data.data);
        void api.get<ApiResponse<{ unreadCount: number }>>('/notifications/unread-count')
          .then((countResponse) => { if (active) setUnreadCount(countResponse.data.data.unreadCount); })
          .catch(() => undefined);
      })
      .catch(() => {
        if (active) clearSession();
      })
      .finally(() => {
        if (active) setCheckingSession(false);
      });

    return () => {
      active = false;
    };
  }, [hydrated, token, clearSession, setSession, setUnreadCount, resetNotificationCount]);

  if (!hydrated || checkingSession) return <LoadingView />;

  return (
    <NavigationContainer>
      {token ? (
        <Stack.Navigator
          screenOptions={{
            headerShadowVisible: false,
            headerStyle: { backgroundColor: '#F6F8FB' },
            headerTintColor: '#101828',
            headerTitleStyle: { fontWeight: '800' },
          }}
        >
          <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
          <Stack.Screen name="MembershipCard" component={MembershipCardScreen} options={{ title: 'Membership Card' }} />
          <Stack.Screen name="Invoices" component={InvoicesScreen} options={{ title: 'Invoices' }} />
          <Stack.Screen name="InvoiceDetails" component={InvoiceDetailsScreen} options={{ title: 'Invoice Details' }} />
          <Stack.Screen name="InvoicePayment" component={InvoicePaymentScreen} options={{ title: 'Payment' }} />
          <Stack.Screen name="PaymentReceipt" component={PaymentReceiptScreen} options={{ title: 'Payment Receipt', headerBackVisible: false }} />
          <Stack.Screen name="PaymentHistory" component={PaymentHistoryScreen} options={{ title: 'Payment History' }} />
          <Stack.Screen name="NotificationDetails" component={NotificationDetailsScreen} options={{ title: 'Notification' }} />
          <Stack.Screen name="BookingDetails" component={BookingDetailsScreen} options={{ title: 'Booking Details' }} />
          <Stack.Screen name="Feedback" component={FeedbackScreen} options={{ title: 'Service Feedback' }} />
          <Stack.Screen name="LibraryAccount" component={LibraryAccountScreen} options={{ title: 'Library Account' }} />
          <Stack.Screen name="RestaurantList" component={RestaurantListScreen} options={{ title: 'Restaurants' }} />
          <Stack.Screen name="RestaurantBooking" component={RestaurantBookingScreen} options={{ title: 'Confirm Reservation' }} />
          <Stack.Screen name="RoomList" component={RoomListScreen} options={{ title: 'Room Availability' }} />
          <Stack.Screen name="RoomBooking" component={RoomBookingScreen} options={{ title: 'Confirm Room' }} />
          <Stack.Screen name="EventDetails" component={EventDetailsScreen} options={{ title: 'Event Details' }} />
          <Stack.Screen name="EventTicket" component={EventTicketScreen} options={{ title: 'Your Ticket', headerBackVisible: false }} />
        </Stack.Navigator>
      ) : (
        <AuthStack.Navigator screenOptions={{ headerShown: false }}>
          <AuthStack.Screen name="Login" component={LoginScreen} />
        </AuthStack.Navigator>
      )}
    </NavigationContainer>
  );
}
