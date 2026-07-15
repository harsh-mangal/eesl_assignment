import {
  AddOutlined,
  CampaignOutlined,
  CloseOutlined,
  RefreshOutlined,
  SearchOutlined,
  VisibilityOutlined,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
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
  Tooltip,
  Typography,
} from '@mui/material';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { api, getApiError } from '../api/client';
import { PageHeader } from '../components/PageHeader';
import type {
  AdminNotification,
  AdminNotificationDetail,
  ApiResponse,
  Member,
  NotificationAudience,
  NotificationType,
} from '../types/api';

const notificationTypes: NotificationType[] = [
  'GENERAL',
  'EVENT',
  'BOOKING_CONFIRMATION',
  'BOOKING_CANCELLATION',
  'PAYMENT_REMINDER',
  'MEMBERSHIP_EXPIRY',
];

const audiences: NotificationAudience[] = [
  'ALL_MEMBERS',
  'ACTIVE_MEMBERS',
  'SELECTED_MEMBER',
  'MEMBERSHIP_TYPE',
];

const nowForInput = () => {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
};

const emptyForm = {
  title: '',
  message: '',
  type: 'GENERAL' as NotificationType,
  audience: 'ALL_MEMBERS' as NotificationAudience,
  selectedMemberId: '',
  membershipType: '',
  publishAt: nowForInput(),
};

function audienceLabel(value: NotificationAudience) {
  return value.split('_').map((part) => part[0] + part.slice(1).toLowerCase()).join(' ');
}

function typeLabel(value: NotificationType) {
  return value.split('_').map((part) => part[0] + part.slice(1).toLowerCase()).join(' ');
}

export function NotificationsPage() {
  const [items, setItems] = useState<AdminNotification[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [type, setType] = useState<NotificationType | ''>('');
  const [audience, setAudience] = useState<NotificationAudience | ''>('');
  const [status, setStatus] = useState<'PUBLISHED' | 'SCHEDULED' | ''>('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState<AdminNotificationDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const membershipTypes = useMemo(
    () => Array.from(new Set(members.map((member) => member.membership?.membershipType).filter(Boolean) as string[])).sort(),
    [members],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [notificationsResponse, membersResponse] = await Promise.all([
        api.get<ApiResponse<{ items: AdminNotification[] }>>('/admin/notifications', {
          params: {
            search: search || undefined,
            type: type || undefined,
            audience: audience || undefined,
            status: status || undefined,
            page: 1,
            limit: 100,
          },
        }),
        api.get<ApiResponse<{ items: Member[] }>>('/admin/members', {
          params: { page: 1, limit: 100 },
        }),
      ]);
      setItems(notificationsResponse.data.data.items);
      setMembers(membersResponse.data.data.items);
    } catch (requestError) {
      setError(getApiError(requestError));
    } finally {
      setLoading(false);
    }
  }, [audience, search, status, type]);

  useEffect(() => {
    const timeout = window.setTimeout(() => void load(), 250);
    return () => window.clearTimeout(timeout);
  }, [load]);

  const openCreate = () => {
    setForm({ ...emptyForm, publishAt: nowForInput(), selectedMemberId: members[0]?.id ?? '' });
    setDialogOpen(true);
    setError('');
  };

  const createNotification = async () => {
    if (form.title.trim().length < 3 || form.message.trim().length < 3) {
      setError('Enter a title and message with at least 3 characters.');
      return;
    }
    if (form.audience === 'SELECTED_MEMBER' && !form.selectedMemberId) {
      setError('Select the member who should receive this notification.');
      return;
    }
    if (form.audience === 'MEMBERSHIP_TYPE' && !form.membershipType) {
      setError('Select a membership type.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await api.post('/admin/notifications', {
        title: form.title.trim(),
        message: form.message.trim(),
        type: form.type,
        audience: form.audience,
        selectedMemberId: form.audience === 'SELECTED_MEMBER' ? form.selectedMemberId : undefined,
        membershipType: form.audience === 'MEMBERSHIP_TYPE' ? form.membershipType : undefined,
        publishAt: new Date(form.publishAt).toISOString(),
      });
      setDialogOpen(false);
      setNotice('Notification created successfully.');
      await load();
    } catch (requestError) {
      setError(getApiError(requestError));
    } finally {
      setSaving(false);
    }
  };

  const openDetail = async (notification: AdminNotification) => {
    setDetailOpen(true);
    setDetail(null);
    setDetailLoading(true);
    try {
      const response = await api.get<ApiResponse<AdminNotificationDetail>>(`/admin/notifications/${notification.id}`);
      setDetail(response.data.data);
    } catch (requestError) {
      setError(getApiError(requestError));
      setDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Notifications"
        subtitle="Publish targeted announcements, reminders and booking updates to member devices."
        action={
          <Stack direction="row" spacing={1}>
            <IconButton onClick={() => void load()} aria-label="Refresh notifications">
              <RefreshOutlined />
            </IconButton>
            <Button variant="contained" startIcon={<AddOutlined />} onClick={openCreate}>
              Create Notification
            </Button>
          </Stack>
        }
      />

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {notice && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setNotice('')}>{notice}</Alert>}

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} mb={2}>
        <TextField
          size="small"
          placeholder="Search title or message"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          sx={{ minWidth: { md: 300 } }}
          slotProps={{
            input: {
              startAdornment: <InputAdornment position="start"><SearchOutlined fontSize="small" /></InputAdornment>,
            },
          }}
        />
        <TextField select size="small" label="Type" value={type} onChange={(event) => setType(event.target.value as NotificationType | '')} sx={{ minWidth: 190 }}>
          <MenuItem value="">All types</MenuItem>
          {notificationTypes.map((item) => <MenuItem key={item} value={item}>{typeLabel(item)}</MenuItem>)}
        </TextField>
        <TextField select size="small" label="Audience" value={audience} onChange={(event) => setAudience(event.target.value as NotificationAudience | '')} sx={{ minWidth: 190 }}>
          <MenuItem value="">All audiences</MenuItem>
          {audiences.map((item) => <MenuItem key={item} value={item}>{audienceLabel(item)}</MenuItem>)}
        </TextField>
        <TextField select size="small" label="Publishing" value={status} onChange={(event) => setStatus(event.target.value as typeof status)} sx={{ minWidth: 150 }}>
          <MenuItem value="">All</MenuItem>
          <MenuItem value="PUBLISHED">Published</MenuItem>
          <MenuItem value="SCHEDULED">Scheduled</MenuItem>
        </TextField>
      </Stack>

      <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
        {loading ? (
          <Box minHeight={340} display="grid" sx={{ placeItems: 'center' }}><CircularProgress /></Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Notification</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Audience</TableCell>
                  <TableCell>Publish time</TableCell>
                  <TableCell>Read progress</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Details</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((notification) => {
                  const progress = notification.recipientCount > 0
                    ? Math.round((notification.readCount / notification.recipientCount) * 100)
                    : 0;
                  return (
                    <TableRow key={notification.id} hover>
                      <TableCell sx={{ maxWidth: 380 }}>
                        <Stack direction="row" spacing={1.25} alignItems="flex-start">
                          <Box width={38} height={38} borderRadius={2} bgcolor="#EFF4FF" color="#175CD3" display="grid" sx={{ placeItems: 'center', flexShrink: 0 }}>
                            <CampaignOutlined fontSize="small" />
                          </Box>
                          <Box minWidth={0}>
                            <Typography fontWeight={800}>{notification.title}</Typography>
                            <Typography variant="body2" color="text.secondary" noWrap>{notification.message}</Typography>
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell><Chip size="small" label={typeLabel(notification.type)} variant="outlined" /></TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={700}>{audienceLabel(notification.audience)}</Typography>
                        {notification.membershipType && <Typography variant="caption" color="text.secondary">{notification.membershipType}</Typography>}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{new Date(notification.publishAt).toLocaleDateString()}</Typography>
                        <Typography variant="caption" color="text.secondary">{new Date(notification.publishAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Typography>
                      </TableCell>
                      <TableCell sx={{ minWidth: 180 }}>
                        <Stack direction="row" justifyContent="space-between" mb={0.5}>
                          <Typography variant="caption">{notification.readCount}/{notification.recipientCount} read</Typography>
                          <Typography variant="caption" fontWeight={700}>{progress}%</Typography>
                        </Stack>
                        <LinearProgress variant="determinate" value={progress} sx={{ height: 7, borderRadius: 999 }} />
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={notification.status}
                          color={notification.status === 'PUBLISHED' ? 'success' : 'warning'}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="View recipients">
                          <IconButton size="small" onClick={() => void openDetail(notification)}>
                            <VisibilityOutlined fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {items.length === 0 && (
                  <TableRow><TableCell colSpan={7} align="center" sx={{ py: 7, color: 'text.secondary' }}>No notifications match these filters.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Dialog open={dialogOpen} onClose={() => !saving && setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Create Notification</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField label="Title" value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} inputProps={{ maxLength: 160 }} />
            <TextField label="Message" value={form.message} onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))} multiline minRows={4} inputProps={{ maxLength: 5000 }} />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField select fullWidth label="Type" value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value as NotificationType }))}>
                {notificationTypes.map((item) => <MenuItem key={item} value={item}>{typeLabel(item)}</MenuItem>)}
              </TextField>
              <TextField select fullWidth label="Audience" value={form.audience} onChange={(event) => setForm((current) => ({ ...current, audience: event.target.value as NotificationAudience }))}>
                {audiences.map((item) => <MenuItem key={item} value={item}>{audienceLabel(item)}</MenuItem>)}
              </TextField>
            </Stack>
            {form.audience === 'SELECTED_MEMBER' && (
              <TextField select label="Member" value={form.selectedMemberId} onChange={(event) => setForm((current) => ({ ...current, selectedMemberId: event.target.value }))}>
                {members.map((member) => <MenuItem key={member.id} value={member.id}>{member.fullName} · {member.memberCode}</MenuItem>)}
              </TextField>
            )}
            {form.audience === 'MEMBERSHIP_TYPE' && (
              <TextField select label="Membership type" value={form.membershipType} onChange={(event) => setForm((current) => ({ ...current, membershipType: event.target.value }))}>
                {membershipTypes.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
              </TextField>
            )}
            <TextField
              label="Publish date and time"
              type="datetime-local"
              value={form.publishAt}
              onChange={(event) => setForm((current) => ({ ...current, publishAt: event.target.value }))}
              slotProps={{ inputLabel: { shrink: true } }}
              helperText="Choose the current time to publish immediately, or a future time to schedule it."
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
          <Button variant="contained" onClick={() => void createNotification()} disabled={saving || !form.publishAt}>
            {saving ? 'Creating…' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} fullWidth maxWidth="md">
        <DialogTitle sx={{ pr: 6 }}>
          Notification Details
          <IconButton onClick={() => setDetailOpen(false)} sx={{ position: 'absolute', right: 12, top: 12 }}><CloseOutlined /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {detailLoading ? (
            <Box minHeight={260} display="grid" sx={{ placeItems: 'center' }}><CircularProgress /></Box>
          ) : detail ? (
            <Stack spacing={2.5}>
              <Box>
                <Typography variant="h6" fontWeight={900}>{detail.title}</Typography>
                <Typography color="text.secondary" mt={1} whiteSpace="pre-wrap">{detail.message}</Typography>
              </Box>
              <Stack direction="row" flexWrap="wrap" gap={1}>
                <Chip label={typeLabel(detail.type)} />
                <Chip label={audienceLabel(detail.audience)} variant="outlined" />
                <Chip label={`${detail.readCount}/${detail.recipientCount} read`} color="primary" variant="outlined" />
                <Chip label={detail.status} color={detail.status === 'PUBLISHED' ? 'success' : 'warning'} />
              </Stack>
              <Divider />
              <Typography fontWeight={800}>Recipients</Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead><TableRow><TableCell>Member</TableCell><TableCell>Email</TableCell><TableCell>Status</TableCell><TableCell>Read at</TableCell></TableRow></TableHead>
                  <TableBody>
                    {detail.recipients.map((recipient) => (
                      <TableRow key={recipient.member.id}>
                        <TableCell><Typography fontWeight={700}>{recipient.member.fullName}</Typography><Typography variant="caption" color="text.secondary">{recipient.member.memberCode}</Typography></TableCell>
                        <TableCell>{recipient.member.email}</TableCell>
                        <TableCell><Chip size="small" label={recipient.isRead ? 'READ' : 'UNREAD'} color={recipient.isRead ? 'success' : 'default'} /></TableCell>
                        <TableCell>{recipient.readAt ? new Date(recipient.readAt).toLocaleString() : '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Stack>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
