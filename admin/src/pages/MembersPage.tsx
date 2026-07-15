import {
  AddOutlined,
  EditOutlined,
  PhotoCameraOutlined,
  RefreshOutlined,
  SearchOutlined,
  VisibilityOutlined,
} from '@mui/icons-material';
import {
  Alert,
  Avatar,
  Box,
  Button,
  ButtonBase,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormLabel,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { api, getApiError } from '../api/client';
import { PageHeader } from '../components/PageHeader';
import type { ApiResponse, Member, MemberDetail } from '../types/api';

type MemberListResponse = {
  items: Member[];
  pagination: { total: number };
};

type MembershipStatus = 'ACTIVE' | 'INACTIVE' | 'EXPIRED';

type MemberForm = {
  memberCode: string;
  fullName: string;
  email: string;
  mobileNumber: string;
  address: string;
  password: string;
  membershipType: string;
  membershipStatus: MembershipStatus;
  validFrom: string;
  validUntil: string;
};

const today = () => new Date().toISOString().slice(0, 10);
const oneYearLater = () => {
  const date = new Date();
  date.setFullYear(date.getFullYear() + 1);
  return date.toISOString().slice(0, 10);
};

const emptyForm = (): MemberForm => ({
  memberCode: '',
  fullName: '',
  email: '',
  mobileNumber: '',
  address: '',
  password: '',
  membershipType: 'Gold',
  membershipStatus: 'ACTIVE',
  validFrom: today(),
  validUntil: oneYearLater(),
});

function dateInput(value?: string | null) {
  return value ? new Date(value).toISOString().slice(0, 10) : '';
}

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '170px 1fr' }} gap={1} py={1.1} borderBottom="1px solid" borderColor="divider">
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      <Typography variant="body2" fontWeight={700}>{value || '—'}</Typography>
    </Box>
  );
}

export function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [search, setSearch] = useState('');
  const [membershipStatus, setMembershipStatus] = useState<MembershipStatus | 'ALL'>('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [uploadingMemberId, setUploadingMemberId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<MemberDetail | null>(null);
  const [form, setForm] = useState<MemberForm>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [details, setDetails] = useState<MemberDetail | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailTab, setDetailTab] = useState(0);

  const loadMembers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get<ApiResponse<MemberListResponse>>('/admin/members', {
        params: {
          search: search || undefined,
          membershipStatus: membershipStatus === 'ALL' ? undefined : membershipStatus,
          page: 1,
          limit: 100,
        },
      });
      setMembers(response.data.data.items);
    } catch (requestError) {
      setError(getApiError(requestError));
    } finally {
      setLoading(false);
    }
  }, [membershipStatus, search]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadMembers(), 250);
    return () => window.clearTimeout(timer);
  }, [loadMembers]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setFormOpen(true);
  };

  const openEdit = async (member: Member) => {
    setError('');
    try {
      const response = await api.get<ApiResponse<MemberDetail>>(`/admin/members/${member.id}`);
      const item = response.data.data;
      setEditing(item);
      setForm({
        memberCode: item.memberCode,
        fullName: item.fullName,
        email: item.email,
        mobileNumber: item.mobileNumber,
        address: item.address,
        password: '',
        membershipType: item.membership?.membershipType ?? 'Gold',
        membershipStatus: item.membership?.status ?? 'INACTIVE',
        validFrom: dateInput(item.membership?.validFrom) || today(),
        validUntil: dateInput(item.membership?.validUntil) || oneYearLater(),
      });
      setFormOpen(true);
    } catch (requestError) {
      setError(getApiError(requestError));
    }
  };

  const viewDetails = async (member: Member) => {
    setDetailsLoading(true);
    setDetailTab(0);
    setError('');
    try {
      const response = await api.get<ApiResponse<MemberDetail>>(`/admin/members/${member.id}`);
      setDetails(response.data.data);
    } catch (requestError) {
      setError(getApiError(requestError));
    } finally {
      setDetailsLoading(false);
    }
  };

  const saveMember = async () => {
    setSaving(true);
    setError('');
    try {
      if (editing) {
        await api.patch(`/admin/members/${editing.id}`, {
          fullName: form.fullName,
          email: form.email,
          mobileNumber: form.mobileNumber,
          address: form.address,
          membershipType: form.membershipType,
          membershipStatus: form.membershipStatus,
          validUntil: form.validUntil,
        });
        setMessage('Member details and membership status updated.');
      } else {
        await api.post('/admin/members', {
          ...form,
          memberCode: form.memberCode.toUpperCase(),
          validFrom: form.validFrom,
          validUntil: form.validUntil,
        });
        setMessage('Member created with login, membership, RFID and library records.');
      }
      setFormOpen(false);
      await loadMembers();
    } catch (requestError) {
      setError(getApiError(requestError));
    } finally {
      setSaving(false);
    }
  };

  const toggleMembership = async (member: Member) => {
    const nextStatus: MembershipStatus = member.membership?.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setError('');
    try {
      await api.patch(`/admin/members/${member.id}`, { membershipStatus: nextStatus });
      setMessage(nextStatus === 'ACTIVE' ? 'Member activated.' : 'Member deactivated. New bookings are now blocked.');
      await loadMembers();
    } catch (requestError) {
      setError(getApiError(requestError));
    }
  };

  const uploadMemberPhoto = async (member: Member, file?: File) => {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Only JPEG, PNG and WebP images are supported.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be 5 MB or less.');
      return;
    }

    setUploadingMemberId(member.id);
    setError('');
    try {
      const upload = new FormData();
      upload.append('image', file);
      await api.post(`/admin/members/${member.id}/photo`, upload, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 45000,
      });
      setMessage(`${member.fullName}'s photo was updated.`);
      await loadMembers();
    } catch (requestError) {
      setError(getApiError(requestError));
    } finally {
      setUploadingMemberId(null);
    }
  };

  const formValid = useMemo(() => {
    const base = form.fullName.trim().length >= 2
      && form.email.includes('@')
      && form.mobileNumber.trim().length >= 7
      && form.address.trim().length >= 5
      && form.membershipType.trim().length >= 2
      && Boolean(form.validUntil);
    return editing ? base : base && form.memberCode.trim().length >= 3 && form.password.length >= 8 && Boolean(form.validFrom);
  }, [editing, form]);

  return (
    <>
      <PageHeader
        title="Members"
        subtitle="Create members, manage account eligibility and review all related transactions."
        action={
          <Stack direction="row" gap={1}>
            <IconButton onClick={() => void loadMembers()} aria-label="Refresh members"><RefreshOutlined /></IconButton>
            <Button variant="contained" startIcon={<AddOutlined />} onClick={openCreate}>Add member</Button>
          </Stack>
        }
      />

      <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Stack direction={{ xs: 'column', md: 'row' }} gap={1.5} p={2} borderBottom="1px solid" borderColor="divider">
          <TextField
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name, member ID, email or phone"
            size="small"
            fullWidth
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchOutlined /></InputAdornment> }}
          />
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <Select value={membershipStatus} onChange={(event) => setMembershipStatus(event.target.value as MembershipStatus | 'ALL')}>
              <MenuItem value="ALL">All memberships</MenuItem>
              <MenuItem value="ACTIVE">Active</MenuItem>
              <MenuItem value="INACTIVE">Inactive</MenuItem>
              <MenuItem value="EXPIRED">Expired</MenuItem>
            </Select>
          </FormControl>
        </Stack>

        {error && <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>}
        {loading ? (
          <Box minHeight={260} display="grid" sx={{ placeItems: 'center' }}><CircularProgress /></Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Member</TableCell>
                  <TableCell>Member ID</TableCell>
                  <TableCell>Contact</TableCell>
                  <TableCell>Membership</TableCell>
                  <TableCell>RFID</TableCell>
                  <TableCell>Valid until</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.id} hover>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1.25}>
                        <Tooltip title="Upload member photo">
                          <ButtonBase component="label" sx={{ borderRadius: '50%' }} disabled={uploadingMemberId === member.id}>
                            <Box position="relative">
                              <Avatar src={member.profilePhotoUrl ?? undefined}>{member.fullName[0]}</Avatar>
                              <Box position="absolute" right={-4} bottom={-4} width={20} height={20} borderRadius="50%" bgcolor="primary.main" color="common.white" display="grid" sx={{ placeItems: 'center' }}>
                                <PhotoCameraOutlined sx={{ fontSize: 13 }} />
                              </Box>
                            </Box>
                            <input hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => {
                              void uploadMemberPhoto(member, event.target.files?.[0]);
                              event.currentTarget.value = '';
                            }} />
                          </ButtonBase>
                        </Tooltip>
                        <Box>
                          <Typography fontWeight={700}>{member.fullName}</Typography>
                          {uploadingMemberId === member.id && <Typography variant="caption" color="primary">Uploading…</Typography>}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>{member.memberCode}</TableCell>
                    <TableCell>
                      <Typography variant="body2">{member.email}</Typography>
                      <Typography variant="caption" color="text.secondary">{member.mobileNumber}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip size="small" label={`${member.membership?.membershipType ?? '—'} · ${member.membership?.status ?? '—'}`} color={member.membership?.status === 'ACTIVE' ? 'success' : member.membership?.status === 'EXPIRED' ? 'warning' : 'default'} />
                    </TableCell>
                    <TableCell>
                      <Chip size="small" label={member.rfidRecord?.status ?? 'Not assigned'} color={member.rfidRecord?.status === 'ACTIVE' ? 'success' : member.rfidRecord?.status === 'BLOCKED' ? 'error' : 'default'} />
                    </TableCell>
                    <TableCell>{member.membership?.validUntil ? new Date(member.membership.validUntil).toLocaleDateString() : '—'}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="View profile and transactions"><IconButton onClick={() => void viewDetails(member)}><VisibilityOutlined /></IconButton></Tooltip>
                      <Tooltip title="Edit member"><IconButton onClick={() => void openEdit(member)}><EditOutlined /></IconButton></Tooltip>
                      <Button size="small" color={member.membership?.status === 'ACTIVE' ? 'error' : 'success'} onClick={() => void toggleMembership(member)}>
                        {member.membership?.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {members.length === 0 && <TableRow><TableCell colSpan={7} align="center" sx={{ py: 6 }}>No members found.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Dialog open={formOpen} onClose={() => !saving && setFormOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>{editing ? 'Edit member' : 'Add member'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} pt={1}>
            {!editing && <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label="Member ID" value={form.memberCode} onChange={(event) => setForm((current) => ({ ...current, memberCode: event.target.value.toUpperCase() }))} /></Grid>}
            <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label="Full name" value={form.fullName} onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))} /></Grid>
            <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label="Email" type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} /></Grid>
            <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label="Mobile number" value={form.mobileNumber} onChange={(event) => setForm((current) => ({ ...current, mobileNumber: event.target.value }))} /></Grid>
            <Grid size={{ xs: 12 }}><TextField fullWidth multiline minRows={2} label="Address" value={form.address} onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))} /></Grid>
            {!editing && <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label="Temporary password" type="password" helperText="Minimum 8 characters" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} /></Grid>}
            <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label="Membership type" value={form.membershipType} onChange={(event) => setForm((current) => ({ ...current, membershipType: event.target.value }))} /></Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <FormControl fullWidth><FormLabel sx={{ mb: 0.75 }}>Membership status</FormLabel><Select value={form.membershipStatus} onChange={(event) => setForm((current) => ({ ...current, membershipStatus: event.target.value as MembershipStatus }))}>
                <MenuItem value="ACTIVE">Active</MenuItem><MenuItem value="INACTIVE">Inactive</MenuItem><MenuItem value="EXPIRED">Expired</MenuItem>
              </Select></FormControl>
            </Grid>
            {!editing && <Grid size={{ xs: 12, sm: 4 }}><TextField fullWidth label="Valid from" type="date" InputLabelProps={{ shrink: true }} value={form.validFrom} onChange={(event) => setForm((current) => ({ ...current, validFrom: event.target.value }))} /></Grid>}
            <Grid size={{ xs: 12, sm: 4 }}><TextField fullWidth label="Valid until" type="date" InputLabelProps={{ shrink: true }} value={form.validUntil} onChange={(event) => setForm((current) => ({ ...current, validUntil: event.target.value }))} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFormOpen(false)} disabled={saving}>Cancel</Button>
          <Button variant="contained" onClick={() => void saveMember()} disabled={!formValid || saving}>{saving ? 'Saving…' : editing ? 'Save changes' : 'Create member'}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(details) || detailsLoading} onClose={() => !detailsLoading && setDetails(null)} fullWidth maxWidth="md">
        <DialogTitle>Member profile</DialogTitle>
        <DialogContent>
          {detailsLoading ? <Box minHeight={260} display="grid" sx={{ placeItems: 'center' }}><CircularProgress /></Box> : details && (
            <>
              <Stack direction={{ xs: 'column', sm: 'row' }} gap={2} alignItems={{ xs: 'flex-start', sm: 'center' }} py={1}>
                <Avatar src={details.profilePhotoUrl ?? undefined} sx={{ width: 72, height: 72 }}>{details.fullName[0]}</Avatar>
                <Box><Typography variant="h6" fontWeight={900}>{details.fullName}</Typography><Typography color="text.secondary">{details.memberCode} · {details.email}</Typography></Box>
                <Chip sx={{ ml: { sm: 'auto' } }} label={details.membership?.status ?? 'No membership'} color={details.membership?.status === 'ACTIVE' ? 'success' : 'default'} />
              </Stack>
              <Tabs value={detailTab} onChange={(_, value) => setDetailTab(value)} variant="scrollable" sx={{ borderBottom: 1, borderColor: 'divider', mb: 1 }}>
                <Tab label="Profile" /><Tab label={`Bookings (${(details._count?.restaurantBookings ?? 0) + (details._count?.roomBookings ?? 0) + (details._count?.eventBookings ?? 0)})`} /><Tab label={`Invoices (${details._count?.invoices ?? 0})`} /><Tab label={`Payments (${details._count?.payments ?? 0})`} />
              </Tabs>
              {detailTab === 0 && <Box>
                <DetailRow label="Mobile" value={details.mobileNumber} /><DetailRow label="Address" value={details.address} /><DetailRow label="Membership type" value={details.membership?.membershipType} /><DetailRow label="Validity" value={details.membership ? `${new Date(details.membership.validFrom).toLocaleDateString()} - ${new Date(details.membership.validUntil).toLocaleDateString()}` : '—'} /><DetailRow label="Digital card" value={details.membership?.digitalCardActive ? 'Active' : 'Inactive'} /><DetailRow label="RFID" value={details.rfidRecord ? `${details.rfidRecord.referenceNumber} · ${details.rfidRecord.status}` : 'Not assigned'} /><DetailRow label="RFID expiry" value={details.rfidRecord?.expiryDate ? new Date(details.rfidRecord.expiryDate).toLocaleDateString() : '—'} /><DetailRow label="Additional services" value={(details.additionalServices ?? []).map((item) => `${item.serviceType}: ${item.status}`).join(', ')} />
              </Box>}
              {detailTab === 1 && <Stack gap={1.25} py={1}>
                {[...(details.restaurantBookings ?? []).map((item) => ({ label: 'Restaurant', number: item.bookingNumber, status: item.status, date: item.createdAt })), ...(details.roomBookings ?? []).map((item) => ({ label: 'Room', number: item.bookingNumber, status: item.status, date: item.checkInDate })), ...(details.eventBookings ?? []).map((item) => ({ label: 'Event', number: item.bookingNumber, status: item.status, date: item.createdAt }))].map((item, index) => <Paper key={`${item.label}-${item.number}-${index}`} variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}><Stack direction="row" justifyContent="space-between"><Box><Typography fontWeight={800}>{item.number}</Typography><Typography variant="caption" color="text.secondary">{item.label} · {new Date(item.date).toLocaleDateString()}</Typography></Box><Chip size="small" label={item.status} /></Stack></Paper>)}
                {(details.restaurantBookings?.length ?? 0) + (details.roomBookings?.length ?? 0) + (details.eventBookings?.length ?? 0) === 0 && <Typography color="text.secondary" py={3} textAlign="center">No booking history.</Typography>}
              </Stack>}
              {detailTab === 2 && <TableContainer><Table size="small"><TableHead><TableRow><TableCell>Invoice</TableCell><TableCell>Description</TableCell><TableCell>Amount</TableCell><TableCell>Status</TableCell></TableRow></TableHead><TableBody>{(details.invoices ?? []).map((item) => <TableRow key={item.id}><TableCell>{item.invoiceNumber}</TableCell><TableCell>{item.description}</TableCell><TableCell>₹{Number(item.amount).toLocaleString('en-IN')}</TableCell><TableCell><Chip size="small" label={item.status} /></TableCell></TableRow>)}{(details.invoices?.length ?? 0) === 0 && <TableRow><TableCell colSpan={4} align="center" sx={{ py: 4 }}>No invoices.</TableCell></TableRow>}</TableBody></Table></TableContainer>}
              {detailTab === 3 && <TableContainer><Table size="small"><TableHead><TableRow><TableCell>Transaction</TableCell><TableCell>Type</TableCell><TableCell>Amount</TableCell><TableCell>Status</TableCell></TableRow></TableHead><TableBody>{(details.payments ?? []).map((item) => <TableRow key={item.id}><TableCell>{item.transactionId}</TableCell><TableCell>{item.paymentType}</TableCell><TableCell>₹{Number(item.amount).toLocaleString('en-IN')}</TableCell><TableCell><Chip size="small" label={item.status} /></TableCell></TableRow>)}{(details.payments?.length ?? 0) === 0 && <TableRow><TableCell colSpan={4} align="center" sx={{ py: 4 }}>No payments.</TableCell></TableRow>}</TableBody></Table></TableContainer>}
            </>
          )}
        </DialogContent>
      </Dialog>

      <Snackbar open={Boolean(message)} autoHideDuration={3500} onClose={() => setMessage('')} message={message} />
    </>
  );
}
