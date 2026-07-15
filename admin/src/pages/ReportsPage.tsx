import {
  AssessmentOutlined,
  DownloadOutlined,
  PictureAsPdfOutlined,
  RefreshOutlined,
  SearchOutlined,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  InputAdornment,
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
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api, getApiError } from '../api/client';
import { PageHeader } from '../components/PageHeader';
import { StatCard } from '../components/StatCard';
import type { ApiResponse, ReportFormat, ReportResult, ReportType } from '../types/api';
import { exportReportCsv, exportReportPdf, formatReportValue } from '../utils/reportExport';

const reportOptions: Array<{ value: ReportType; label: string }> = [
  { value: 'MEMBERS', label: 'Member report' },
  { value: 'BOOKINGS', label: 'Consolidated booking report' },
  { value: 'PAYMENTS', label: 'Payment report' },
  { value: 'ROOM_AVAILABILITY', label: 'Room availability report' },
  { value: 'RESTAURANT_BOOKINGS', label: 'Restaurant booking report' },
  { value: 'EVENT_BOOKINGS', label: 'Event booking report' },
  { value: 'EVENT_ATTENDANCE', label: 'Event attendance report' },
  { value: 'FEEDBACK', label: 'Feedback report' },
  { value: 'RFID_STATUS', label: 'RFID status report' },
];

const statusOptions: Partial<Record<ReportType, Array<{ value: string; label: string }>>> = {
  MEMBERS: ['ACTIVE', 'INACTIVE', 'EXPIRED'].map((value) => ({ value, label: value })),
  BOOKINGS: ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].map((value) => ({ value, label: value })),
  PAYMENTS: ['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED'].map((value) => ({ value, label: value })),
  ROOM_AVAILABILITY: ['AVAILABLE', 'UNAVAILABLE', 'MAINTENANCE'].map((value) => ({ value, label: value })),
  RESTAURANT_BOOKINGS: ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].map((value) => ({ value, label: value })),
  EVENT_BOOKINGS: ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].map((value) => ({ value, label: value })),
  EVENT_ATTENDANCE: [
    { value: 'CHECKED_IN', label: 'Has check-ins' },
    { value: 'NOT_CHECKED_IN', label: 'No check-ins' },
  ],
  FEEDBACK: [5, 4, 3, 2, 1].map((value) => ({ value: String(value), label: `${value} stars` })),
  RFID_STATUS: ['ACTIVE', 'INACTIVE', 'BLOCKED', 'EXPIRED'].map((value) => ({ value, label: value })),
};

function localDate(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function defaultDates() {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  return { from: localDate(from), to: localDate(to) };
}

function isStatusLike(value: unknown) {
  return typeof value === 'string' && ['ACTIVE', 'INACTIVE', 'EXPIRED', 'BLOCKED', 'AVAILABLE', 'UNAVAILABLE', 'MAINTENANCE', 'BOOKED', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'SUCCESS', 'FAILED', 'REFUNDED', 'VALID', 'INVALID', 'YES', 'NO'].includes(value);
}

export function ReportsPage() {
  const dates = useMemo(defaultDates, []);
  const [reportType, setReportType] = useState<ReportType>('BOOKINGS');
  const [dateFrom, setDateFrom] = useState(dates.from);
  const [dateTo, setDateTo] = useState(dates.to);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [report, setReport] = useState<ReportResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get<ApiResponse<ReportResult>>(`/admin/reports/${reportType}`, {
        params: {
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
          status: status || undefined,
          search: search || undefined,
        },
      });
      setReport(response.data.data);
    } catch (requestError) {
      setError(getApiError(requestError));
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, reportType, search, status]);

  useEffect(() => {
    const timeout = window.setTimeout(() => void load(), 300);
    return () => window.clearTimeout(timeout);
  }, [load]);

  const changeReport = (value: ReportType) => {
    setReportType(value);
    setStatus('');
    setSearch('');
  };

  const statuses = statusOptions[reportType] ?? [];

  return (
    <>
      <PageHeader
        title="Reports"
        subtitle="Generate database-backed operational reports and export the current filtered result as CSV or PDF."
        action={
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Button variant="outlined" startIcon={<RefreshOutlined />} onClick={() => void load()}>Refresh</Button>
            <Button variant="outlined" startIcon={<DownloadOutlined />} disabled={!report?.rows.length || loading} onClick={() => report && exportReportCsv(report)}>CSV</Button>
            <Button variant="contained" startIcon={<PictureAsPdfOutlined />} disabled={!report?.rows.length || loading} onClick={() => report && void exportReportPdf(report)}>PDF</Button>
          </Stack>
        }
      />

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, mb: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ md: 'center' }}>
          <TextField select size="small" label="Report" value={reportType} onChange={(event) => changeReport(event.target.value as ReportType)} sx={{ minWidth: 245 }}>
            {reportOptions.map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
          </TextField>
          <TextField size="small" label="From" type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
          <TextField size="small" label="To" type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: dateFrom || undefined } }} />
          {statuses.length > 0 && (
            <TextField select size="small" label={reportType === 'FEEDBACK' ? 'Rating' : 'Status'} value={status} onChange={(event) => setStatus(event.target.value)} sx={{ minWidth: 165 }}>
              <MenuItem value="">All</MenuItem>
              {statuses.map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
            </TextField>
          )}
          <TextField
            size="small"
            placeholder="Search current report"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            sx={{ flex: 1, minWidth: 220 }}
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchOutlined fontSize="small" /></InputAdornment> } }}
          />
        </Stack>
      </Paper>

      {loading && !report ? (
        <Box minHeight={420} display="grid" sx={{ placeItems: 'center' }}><CircularProgress /></Box>
      ) : report ? (
        <>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={3} flexWrap="wrap" useFlexGap>
            {report.summary.map((item) => (
              <Box key={item.label} flex="1 1 190px">
                <StatCard label={item.label} value={formatReportValue(item.value, item.format)} icon={<AssessmentOutlined />} />
              </Box>
            ))}
          </Stack>

          <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2.5} mb={3}>
            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, flex: 1, minHeight: 310 }}>
              <Typography fontWeight={900}>{report.title}</Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>{report.description}</Typography>
              {report.breakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height={230}>
                  <BarChart data={report.breakdown.slice(0, 12)} margin={{ top: 8, right: 8, left: 0, bottom: 28 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" angle={-22} textAnchor="end" height={54} interval={0} tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#175CD3" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <Box height={230} display="grid" sx={{ placeItems: 'center' }} color="text.secondary">No chart data for the selected filters.</Box>}
            </Paper>

            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, width: { lg: 310 } }}>
              <Typography fontWeight={900} mb={2}>Report details</Typography>
              <Stack spacing={1.5}>
                <Box><Typography variant="caption" color="text.secondary">Generated</Typography><Typography fontWeight={700}>{new Date(report.generatedAt).toLocaleString('en-IN')}</Typography></Box>
                <Box><Typography variant="caption" color="text.secondary">Date range</Typography><Typography fontWeight={700}>{report.dateRange.from ?? 'Beginning'} — {report.dateRange.to ?? 'Today'}</Typography></Box>
                <Box><Typography variant="caption" color="text.secondary">Rows</Typography><Typography fontWeight={700}>{report.rows.length.toLocaleString('en-IN')}</Typography></Box>
                <Alert severity="info" icon={false}>CSV and PDF exports use the same active report, date range, status and search filters shown on this page.</Alert>
              </Stack>
            </Paper>
          </Stack>

          <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden', position: 'relative' }}>
            {loading && <Box position="absolute" bgcolor="rgba(255,255,255,0.65)" zIndex={2} display="grid" sx={{ inset: 0, placeItems: 'center' }}><CircularProgress size={30} /></Box>}
            <TableContainer sx={{ maxHeight: 620 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>{report.columns.map((column) => <TableCell key={column.key} align={column.align ?? 'left'} sx={{ fontWeight: 900, whiteSpace: 'nowrap' }}>{column.label}</TableCell>)}</TableRow>
                </TableHead>
                <TableBody>
                  {report.rows.map((row, index) => (
                    <TableRow key={`${report.reportType}-${index}`} hover>
                      {report.columns.map((column) => {
                        const value = row[column.key];
                        return (
                          <TableCell key={column.key} align={column.align ?? 'left'} sx={{ minWidth: column.key === 'comments' ? 280 : undefined, maxWidth: column.key === 'comments' || column.key === 'amenities' ? 360 : undefined }}>
                            {isStatusLike(value) ? <Chip size="small" variant="outlined" label={String(value)} /> : <Typography variant="body2" whiteSpace={column.key === 'comments' ? 'normal' : 'nowrap'}>{formatReportValue(value, column.format as ReportFormat)}</Typography>}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                  {report.rows.length === 0 && <TableRow><TableCell colSpan={report.columns.length} align="center" sx={{ py: 8, color: 'text.secondary' }}>No report rows match the selected filters.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </>
      ) : null}
    </>
  );
}
