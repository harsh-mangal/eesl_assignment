import {
  AccountBalanceWalletOutlined,
  BadgeOutlined,
  BedOutlined,
  EventOutlined,
  GroupsOutlined,
  MeetingRoomOutlined,
  PeopleOutline,
  PersonOffOutlined,
  PaymentsOutlined,
  ReceiptLongOutlined,
  RestaurantOutlined,
  StarOutline,
  TodayOutlined,
} from '@mui/icons-material';
import { Alert, Box, CircularProgress, Grid, Paper, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { api, getApiError } from '../api/client';
import { PageHeader } from '../components/PageHeader';
import { StatCard } from '../components/StatCard';
import type { AdminDashboard, ApiResponse } from '../types/api';

const pieColors = ['#175cd3', '#d92d20'];

export function DashboardPage() {
  const [data, setData] = useState<AdminDashboard | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get<ApiResponse<AdminDashboard>>('/dashboard/admin')
      .then((response) => setData(response.data.data))
      .catch((requestError) => setError(getApiError(requestError)));
  }, []);

  if (!data && !error) {
    return <Box minHeight={360} display="grid" sx={{ placeItems: 'center' }}><CircularProgress /></Box>;
  }

  if (error) return <Alert severity="error">{error}</Alert>;
  if (!data) return null;

  const stats = data.statistics;
  const cards = [
    ['Total Members', stats.totalMembers, <GroupsOutlined />],
    ['Active Members', stats.activeMembers, <PeopleOutline />],
    ['Inactive Members', stats.inactiveMembers, <PersonOffOutlined />],
    ['Active RFID Cards', stats.activeRfidCards, <BadgeOutlined />],
    ['Blocked RFID Cards', stats.blockedRfidCards, <BadgeOutlined />],
    ['Total Restaurants', stats.totalRestaurants, <RestaurantOutlined />],
    ['Available Restaurant Slots', stats.availableRestaurantSlots, <RestaurantOutlined />],
    ['Available Rooms', stats.availableRooms, <BedOutlined />],
    ['Unavailable Rooms', stats.unavailableRooms, <MeetingRoomOutlined />],
    ['Upcoming Events', stats.upcomingEvents, <EventOutlined />],
    ["Today's Bookings", stats.todaysBookings, <TodayOutlined />],
    ['Pending Invoices', stats.pendingInvoices, <ReceiptLongOutlined />],
    ['Successful Payments', stats.successfulPayments, <PaymentsOutlined />],
    ['Total Payment Amount', `₹${Number(stats.totalPaymentAmount ?? 0).toLocaleString('en-IN')}`, <AccountBalanceWalletOutlined />],
    ['Average Feedback Rating', stats.averageFeedbackRating, <StarOutline />],
  ] as const;

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Live statistics generated from the MySQL database." />
      <Grid container spacing={2}>
        {cards.map(([label, value, icon]) => (
          <Grid key={label} size={{ xs: 12, sm: 6, lg: 3 }}>
            <StatCard label={label} value={value} icon={icon} />
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2} mt={0.25}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, height: 360 }}>
            <Typography variant="h6" fontWeight={800} mb={2}>Bookings by service</Typography>
            <ResponsiveContainer width="100%" height="85%">
              <BarChart data={data.charts.bookingsByService}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#175cd3" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, lg: 5 }}>
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, height: 360 }}>
            <Typography variant="h6" fontWeight={800} mb={2}>Member status</Typography>
            <ResponsiveContainer width="100%" height="85%">
              <PieChart>
                <Pie
                  data={data.charts.memberStatus}
                  dataKey="value"
                  nameKey="label"
                  innerRadius={65}
                  outerRadius={105}
                  paddingAngle={3}
                  label
                >
                  {data.charts.memberStatus.map((entry, index) => (
                    <Cell key={entry.label} fill={pieColors[index % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </>
  );
}
