import {
  BadgeOutlined,
  DashboardOutlined,
  LogoutOutlined,
  MenuOutlined,
  PeopleAltOutlined,
  RestaurantOutlined,
  HotelOutlined,
  EventOutlined,
  CalendarMonthOutlined,
  PaymentsOutlined,
  ReceiptLongOutlined,
  QrCodeScannerOutlined,
  NotificationsActiveOutlined,
  RateReviewOutlined,
  AssessmentOutlined,
} from '@mui/icons-material';
import {
  AppBar,
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const drawerWidth = 248;
const navigation = [
  { label: 'Dashboard', path: '/', icon: <DashboardOutlined /> },
  { label: 'Members', path: '/members', icon: <PeopleAltOutlined /> },
  { label: 'RFID Records', path: '/rfid', icon: <BadgeOutlined /> },
  { label: 'Restaurants', path: '/restaurants', icon: <RestaurantOutlined /> },
  { label: 'Rooms', path: '/rooms', icon: <HotelOutlined /> },
  { label: 'Events', path: '/events', icon: <EventOutlined /> },
  { label: 'Bookings', path: '/bookings', icon: <CalendarMonthOutlined /> },
  { label: 'Invoices', path: '/invoices', icon: <ReceiptLongOutlined /> },
  { label: 'Payments', path: '/payments', icon: <PaymentsOutlined /> },
  { label: 'Notifications', path: '/notifications', icon: <NotificationsActiveOutlined /> },
  { label: 'Feedback', path: '/feedback', icon: <RateReviewOutlined /> },
  { label: 'Reports', path: '/reports', icon: <AssessmentOutlined /> },
  { label: 'QR Verification', path: '/qr-verification', icon: <QrCodeScannerOutlined /> },
];

export function AdminLayout() {
  const theme = useTheme();
  const desktop = useMediaQuery(theme.breakpoints.up('md'));
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();

  const drawer = (
    <Box display="flex" flexDirection="column" height="100%">
      <Toolbar>
        <Box>
          <Typography fontWeight={800}>Member Services</Typography>
          <Typography variant="caption" color="text.secondary">
            Administration
          </Typography>
        </Box>
      </Toolbar>
      <Divider />
      <List sx={{ px: 1.5, py: 2 }}>
        {navigation.map((item) => (
          <ListItemButton
            key={item.path}
            component={NavLink}
            to={item.path}
            selected={location.pathname === item.path}
            onClick={() => setOpen(false)}
            sx={{ borderRadius: 2, mb: 0.5 }}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>
      <Box mt="auto" p={2}>
        <Typography variant="caption" color="text.secondary" display="block">
          Signed in as
        </Typography>
        <Typography variant="body2" fontWeight={700} noWrap mb={1.5}>
          {user?.email}
        </Typography>
        <Button fullWidth variant="outlined" startIcon={<LogoutOutlined />} onClick={logout}>
          Logout
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box display="flex" minHeight="100vh" bgcolor="#f6f8fb">
      <AppBar
        position="fixed"
        color="inherit"
        elevation={0}
        sx={{
          borderBottom: '1px solid',
          borderColor: 'divider',
          ml: desktop ? `${drawerWidth}px` : 0,
          width: desktop ? `calc(100% - ${drawerWidth}px)` : '100%',
        }}
      >
        <Toolbar>
          {!desktop && (
            <IconButton edge="start" onClick={() => setOpen(true)} sx={{ mr: 1 }}>
              <MenuOutlined />
            </IconButton>
          )}
          <Typography variant="h6" fontWeight={800}>
            Integrated Member Services
          </Typography>
        </Toolbar>
      </AppBar>

      <Drawer
        variant={desktop ? 'permanent' : 'temporary'}
        open={desktop || open}
        onClose={() => setOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box' },
        }}
      >
        {drawer}
      </Drawer>

      <Box component="main" flexGrow={1} p={{ xs: 2, md: 3 }} width={{ md: `calc(100% - ${drawerWidth}px)` }}>
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}
