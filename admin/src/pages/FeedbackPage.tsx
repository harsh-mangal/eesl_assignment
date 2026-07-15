import {
  ChatOutlined,
  EventOutlined,
  HotelOutlined,
  RefreshOutlined,
  RestaurantOutlined,
  SearchOutlined,
  StarRounded,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  InputAdornment,
  LinearProgress,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { api, getApiError } from '../api/client';
import { PageHeader } from '../components/PageHeader';
import { StatCard } from '../components/StatCard';
import type { ApiResponse, Feedback, FeedbackListResult, ServiceType } from '../types/api';

const serviceIcons: Record<ServiceType, React.ReactNode> = {
  RESTAURANT: <RestaurantOutlined fontSize="small" />,
  ROOM: <HotelOutlined fontSize="small" />,
  EVENT: <EventOutlined fontSize="small" />,
};

function label(value: string) {
  return value.split('_').map((part) => part[0] + part.slice(1).toLowerCase()).join(' ');
}

function Rating({ value }: { value: number }) {
  return (
    <Stack direction="row" spacing={0.2} alignItems="center" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <StarRounded key={star} sx={{ fontSize: 18, color: star <= value ? '#F79009' : '#D0D5DD' }} />
      ))}
      <Typography variant="caption" fontWeight={800} ml={0.5}>{value}/5</Typography>
    </Stack>
  );
}

export function FeedbackPage() {
  const [result, setResult] = useState<FeedbackListResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [serviceType, setServiceType] = useState<ServiceType | ''>('');
  const [rating, setRating] = useState<number | ''>('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get<ApiResponse<FeedbackListResult>>('/admin/feedback', {
        params: {
          search: search || undefined,
          serviceType: serviceType || undefined,
          rating: rating || undefined,
          page: 1,
          limit: 100,
        },
      });
      setResult(response.data.data);
    } catch (requestError) {
      setError(getApiError(requestError));
    } finally {
      setLoading(false);
    }
  }, [rating, search, serviceType]);

  useEffect(() => {
    const timeout = window.setTimeout(() => void load(), 250);
    return () => window.clearTimeout(timeout);
  }, [load]);

  const maximumRatingCount = useMemo(
    () => Math.max(1, ...(result?.summary.ratingDistribution.map((item) => item.count) ?? [1])),
    [result],
  );

  const serviceCount = (type: ServiceType) => result?.summary.byService.find((item) => item.serviceType === type)?.count ?? 0;

  return (
    <>
      <PageHeader
        title="Feedback"
        subtitle="Review completed-service ratings, member comments and booking context."
        action={<Button variant="outlined" startIcon={<RefreshOutlined />} onClick={() => void load()}>Refresh</Button>}
      />

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={3}>
        <Box flex={1}><StatCard label="Feedback records" value={result?.summary.total ?? 0} icon={<ChatOutlined />} /></Box>
        <Box flex={1}><StatCard label="Average rating" value={`${(result?.summary.averageRating ?? 0).toFixed(1)} / 5`} icon={<StarRounded />} /></Box>
        <Box flex={1}><StatCard label="Restaurant" value={serviceCount('RESTAURANT')} icon={<RestaurantOutlined />} /></Box>
        <Box flex={1}><StatCard label="Rooms & events" value={serviceCount('ROOM') + serviceCount('EVENT')} icon={<EventOutlined />} /></Box>
      </Stack>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} mb={3} alignItems="stretch">
        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, flex: 1 }}>
          <Typography fontWeight={900} mb={2}>Rating distribution</Typography>
          <Stack spacing={1.4}>
            {[5, 4, 3, 2, 1].map((value) => {
              const count = result?.summary.ratingDistribution.find((item) => item.rating === value)?.count ?? 0;
              return (
                <Stack key={value} direction="row" spacing={1.5} alignItems="center">
                  <Typography variant="body2" fontWeight={800} width={28}>{value}★</Typography>
                  <LinearProgress
                    variant="determinate"
                    value={(count / maximumRatingCount) * 100}
                    sx={{ flex: 1, height: 8, borderRadius: 99 }}
                  />
                  <Typography variant="caption" color="text.secondary" width={24} textAlign="right">{count}</Typography>
                </Stack>
              );
            })}
          </Stack>
        </Paper>

        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, flex: 2 }}>
          <Typography fontWeight={900} mb={2}>Filters</Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              fullWidth
              size="small"
              label="Search"
              placeholder="Member, booking number or comment"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchOutlined fontSize="small" /></InputAdornment> }}
            />
            <TextField select size="small" label="Service" value={serviceType} onChange={(event) => setServiceType(event.target.value as ServiceType | '')} sx={{ minWidth: 170 }}>
              <MenuItem value="">All services</MenuItem>
              <MenuItem value="RESTAURANT">Restaurant</MenuItem>
              <MenuItem value="ROOM">Room</MenuItem>
              <MenuItem value="EVENT">Event</MenuItem>
            </TextField>
            <TextField select size="small" label="Rating" value={rating} onChange={(event) => setRating(event.target.value === '' ? '' : Number(event.target.value))} sx={{ minWidth: 140 }}>
              <MenuItem value="">All ratings</MenuItem>
              {[5, 4, 3, 2, 1].map((value) => <MenuItem key={value} value={value}>{value} stars</MenuItem>)}
            </TextField>
          </Stack>
        </Paper>
      </Stack>

      <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
        {loading ? (
          <Box minHeight={340} display="grid" sx={{ placeItems: 'center' }}><CircularProgress /></Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Member</TableCell>
                  <TableCell>Service & booking</TableCell>
                  <TableCell>Rating</TableCell>
                  <TableCell sx={{ minWidth: 280 }}>Comments</TableCell>
                  <TableCell>Submitted</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(result?.items ?? []).map((feedback: Feedback) => (
                  <TableRow key={feedback.id} hover>
                    <TableCell>
                      <Typography fontWeight={800}>{feedback.member.fullName}</Typography>
                      <Typography variant="caption" color="text.secondary">{feedback.member.memberCode} · {feedback.member.email}</Typography>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="flex-start">
                        <Box width={34} height={34} borderRadius={2} bgcolor="#EFF4FF" color="#175CD3" display="grid" sx={{ placeItems: 'center', flexShrink: 0 }}>
                          {serviceIcons[feedback.serviceType]}
                        </Box>
                        <Box>
                          <Stack direction="row" spacing={0.7} alignItems="center">
                            <Typography fontWeight={800}>{feedback.relatedBooking?.serviceName ?? label(feedback.serviceType)}</Typography>
                            <Chip size="small" variant="outlined" label={label(feedback.serviceType)} />
                          </Stack>
                          <Typography variant="caption" color="text.secondary" display="block">
                            {feedback.relatedBooking?.bookingNumber ?? 'Booking unavailable'}
                            {feedback.relatedBooking?.ticketNumber ? ` · ${feedback.relatedBooking.ticketNumber}` : ''}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">{feedback.relatedBooking?.detail}</Typography>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell><Rating value={feedback.rating} /></TableCell>
                    <TableCell>
                      <Typography variant="body2" whiteSpace="pre-wrap" lineHeight={1.5}>{feedback.comments}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{new Date(feedback.createdAt).toLocaleDateString()}</Typography>
                      <Typography variant="caption" color="text.secondary">{new Date(feedback.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Typography>
                    </TableCell>
                  </TableRow>
                ))}
                {(result?.items.length ?? 0) === 0 && (
                  <TableRow><TableCell colSpan={5} align="center" sx={{ py: 7, color: 'text.secondary' }}>No feedback matches these filters.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </>
  );
}
