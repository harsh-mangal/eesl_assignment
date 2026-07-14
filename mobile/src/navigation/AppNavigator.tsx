import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { ComponentProps } from 'react';
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
import { ModulePlaceholderScreen } from '../screens/ModulePlaceholderScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { useAuthStore } from '../store/authStore';
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
  return (
    <Tabs.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#175CD3',
        tabBarInactiveTintColor: '#667085',
        tabBarStyle: { height: 66, paddingTop: 7, paddingBottom: 7, borderTopColor: '#EAECF0' },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700' },
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
      <Tabs.Screen name="Events">
        {() => (
          <ModulePlaceholderScreen
            title="Events"
            description="Upcoming events, filters, ticket selection, payment and QR tickets will be connected here."
            icon="ticket-outline"
          />
        )}
      </Tabs.Screen>
      <Tabs.Screen name="Notifications">
        {() => (
          <ModulePlaceholderScreen
            title="Notifications"
            description="Database-driven announcements, reminders and read/unread management will be connected here."
            icon="notifications-outline"
          />
        )}
      </Tabs.Screen>
      <Tabs.Screen name="Profile" component={ProfileScreen} />
    </Tabs.Navigator>
  );
}

export function AppNavigator() {
  const token = useAuthStore((state) => state.token);
  const hydrated = useAuthStore((state) => state.hydrated);
  const clearSession = useAuthStore((state) => state.clearSession);
  const setSession = useAuthStore((state) => state.setSession);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    if (!hydrated) return;
    if (!token) {
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
  }, [hydrated, token, clearSession, setSession]);

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
          <Stack.Screen name="RestaurantList" component={RestaurantListScreen} options={{ title: 'Restaurants' }} />
          <Stack.Screen name="RestaurantBooking" component={RestaurantBookingScreen} options={{ title: 'Confirm Reservation' }} />
          <Stack.Screen name="RoomList" component={RoomListScreen} options={{ title: 'Room Availability' }} />
          <Stack.Screen name="RoomBooking" component={RoomBookingScreen} options={{ title: 'Confirm Room' }} />
        </Stack.Navigator>
      ) : (
        <AuthStack.Navigator screenOptions={{ headerShown: false }}>
          <AuthStack.Screen name="Login" component={LoginScreen} />
        </AuthStack.Navigator>
      )}
    </NavigationContainer>
  );
}
