import {
  AddOutlined,
  CancelOutlined,
  EditOutlined,
  RefreshOutlined,
  SearchOutlined,
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
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Snackbar,
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
import type { ApiResponse, Invoice, InvoiceStatus, Member } from '../types/api';

const dateOnly = (value: Date | string) => {
  const date = typeof value === 'string' ? new Date(value) : value;
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};

const today = dateOnly(new Date());
const defaultDue = (() => {
  const value = new Date();
  value.setDate(value.getDate() + 30);
  return dateOnly(value);
})();

type InvoiceForm = {
  memberId: string;
  description: string;
  amount: string;
  issueDate: string;
  dueDate: string;
};

const emptyForm: InvoiceForm = {
  memberId: '',
  description: '',
  amount: '',
  issueDate: today,
  dueDate: defaultDue,
};

function statusColor(status: InvoiceStatus): 'success' | 'warning' | 'error' | 'default' {
  if (status === 'PAID') return 'success';
  if (status === 'OVERDUE') return 'error';
  if (status === 'UNPAID') return 'warning';
  return 'default';
}

export function InvoicesPage() {
  const [items, setItems] = useState<Invoice[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<InvoiceStatus | ''>('');
  const [memberId, setMemberId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [totals, setTotals] = useState({ filteredAmount: 0, outstandingAmount: 0 });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Invoice | null>(null);
  const [form, setForm] = useState<InvoiceForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');

  const loadMembers = useCallback(async () => {
    try {
      const response = await api.get<ApiResponse<{ items: Member[] }>>('/admin/members', {
        params: { page: 1, limit: 100 },
      });
      setMembers(response.data.data.items);
    } catch (requestError) {
      setError(getApiError(requestError));
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get<
        ApiResponse<{ items: Invoice[]; totals: { filteredAmount: number; outstandingAmount: number } }>
      >('/admin/invoices', {
        params: {
          search: search || undefined,
          status: status || undefined,
          memberId: memberId || undefined,
          page: 1,
          limit: 200,
        },
      });
      setItems(response.data.data.items);
      setTotals(response.data.data.totals);
    } catch (requestError) {
      setError(getApiError(requestError));
    } finally {
      setLoading(false);
    }
  }, [memberId, search, status]);

  useEffect(() => {
    void loadMembers();
  }, [loadMembers]);

  useEffect(() => {
    const timeout = window.setTimeout(() => void load(), 250);
    return () => window.clearTimeout(timeout);
  }, [load]);

  const selectedMember = useMemo(
    () => members.find((member) => member.id === form.memberId),
    [form.memberId, members],
  );

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, memberId: members[0]?.id ?? '' });
    setDialogOpen(true);
  };

  const openEdit = (invoice: Invoice) => {
    setEditing(invoice);
    setForm({
      memberId: invoice.member.id,
      description: invoice.description,
      amount: String(invoice.amount),
      issueDate: dateOnly(invoice.issueDate),
      dueDate: dateOnly(invoice.dueDate),
    });
    setDialogOpen(true);
  };

  const save = async () => {
    const amount = Number(form.amount);
    if (!form.memberId || form.description.trim().length < 3 || !Number.isFinite(amount) || amount <= 0) {
      setError('Select a member and enter a valid description and amount.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        description: form.description.trim(),
        amount,
        issueDate: form.issueDate,
        dueDate: form.dueDate,
      };
      if (editing) {
        await api.patch(`/admin/invoices/${editing.id}`, payload);
        setNotice('Invoice updated.');
      } else {
        await api.post('/admin/invoices', { ...payload, memberId: form.memberId });
        setNotice('Invoice created.');
      }
      setDialogOpen(false);
      await load();
    } catch (requestError) {
      setError(getApiError(requestError));
    } finally {
      setSaving(false);
    }
  };

  const cancelInvoice = async (invoice: Invoice) => {
    if (!window.confirm(`Cancel ${invoice.invoiceNumber}? The member will no longer be able to pay it.`)) return;
    try {
      await api.patch(`/admin/invoices/${invoice.id}/cancel`);
      setNotice('Invoice cancelled.');
      await load();
    } catch (requestError) {
      setError(getApiError(requestError));
    }
  };

  return (
    <>
      <PageHeader
        title="Invoices"
        subtitle="Create member invoices, track dues and payments, and prevent changes after settlement."
        action={
          <Stack direction="row" spacing={1}>
            <IconButton onClick={() => void load()} aria-label="Refresh invoices">
              <RefreshOutlined />
            </IconButton>
            <Button variant="contained" startIcon={<AddOutlined />} onClick={openCreate}>
              Create Invoice
            </Button>
          </Stack>
        }
      />

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Stack direction={{ xs: 'column', lg: 'row' }} spacing={1.5} mb={2}>
        <TextField
          size="small"
          placeholder="Search invoice, description or member"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          sx={{ minWidth: { md: 320 } }}
          slotProps={{
            input: {
              startAdornment: <InputAdornment position="start"><SearchOutlined fontSize="small" /></InputAdornment>,
            },
          }}
        />
        <TextField
          select
          size="small"
          label="Status"
          value={status}
          onChange={(event) => setStatus(event.target.value as InvoiceStatus | '')}
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="">All</MenuItem>
          {(['UNPAID', 'OVERDUE', 'PAID', 'CANCELLED'] as InvoiceStatus[]).map((item) => (
            <MenuItem key={item} value={item}>{item}</MenuItem>
          ))}
        </TextField>
        <TextField
          select
          size="small"
          label="Member"
          value={memberId}
          onChange={(event) => setMemberId(event.target.value)}
          sx={{ minWidth: 220 }}
        >
          <MenuItem value="">All members</MenuItem>
          {members.map((member) => (
            <MenuItem key={member.id} value={member.id}>{member.fullName} · {member.memberCode}</MenuItem>
          ))}
        </TextField>
        <Stack direction="row" spacing={1} ml={{ lg: 'auto' }}>
          <Box bgcolor="#101828" color="white" px={2.25} py={1} borderRadius={2} minWidth={150}>
            <Typography variant="caption" color="#98A2B3">FILTERED VALUE</Typography>
            <Typography fontWeight={900}>₹{totals.filteredAmount.toLocaleString('en-IN')}</Typography>
          </Box>
          <Box bgcolor="#FFF4E5" color="#9A3412" px={2.25} py={1} borderRadius={2} minWidth={150}>
            <Typography variant="caption">OUTSTANDING</Typography>
            <Typography fontWeight={900}>₹{totals.outstandingAmount.toLocaleString('en-IN')}</Typography>
          </Box>
        </Stack>
      </Stack>

      <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
        {loading ? (
          <Box minHeight={340} display="grid" sx={{ placeItems: 'center' }}><CircularProgress /></Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Invoice</TableCell>
                  <TableCell>Member</TableCell>
                  <TableCell>Dates</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Payment</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((invoice) => {
                  const editable = invoice.status === 'UNPAID' || invoice.status === 'OVERDUE';
                  return (
                    <TableRow key={invoice.id} hover>
                      <TableCell sx={{ maxWidth: 300 }}>
                        <Typography fontWeight={800}>{invoice.invoiceNumber}</Typography>
                        <Typography variant="body2" color="text.secondary" noWrap>{invoice.description}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography fontWeight={700}>{invoice.member.fullName}</Typography>
                        <Typography variant="caption" color="text.secondary">{invoice.member.memberCode}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">Issued {new Date(invoice.issueDate).toLocaleDateString()}</Typography>
                        <Typography variant="caption" color="text.secondary">Due {new Date(invoice.dueDate).toLocaleDateString()}</Typography>
                      </TableCell>
                      <TableCell><Typography fontWeight={800}>₹{invoice.amount.toLocaleString('en-IN')}</Typography></TableCell>
                      <TableCell><Chip size="small" label={invoice.status} color={statusColor(invoice.status)} /></TableCell>
                      <TableCell>
                        {invoice.payment ? (
                          <Box>
                            <Typography variant="body2" fontWeight={700}>{invoice.payment.transactionId}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {invoice.payment.paymentMethod} · {new Date(invoice.payment.paidAt).toLocaleDateString()}
                            </Typography>
                          </Box>
                        ) : '—'}
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title={editable ? 'Edit invoice' : 'Paid or cancelled invoices cannot be edited'}>
                          <span>
                            <IconButton size="small" disabled={!editable} onClick={() => openEdit(invoice)}>
                              <EditOutlined fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title={editable ? 'Cancel invoice' : 'Invoice cannot be cancelled'}>
                          <span>
                            <IconButton size="small" color="error" disabled={!editable} onClick={() => void cancelInvoice(invoice)}>
                              <CancelOutlined fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {items.length === 0 && (
                  <TableRow><TableCell colSpan={7} align="center" sx={{ py: 7 }}>No invoices match the current filters.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Dialog open={dialogOpen} onClose={() => !saving && setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editing ? `Edit ${editing.invoiceNumber}` : 'Create member invoice'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField
              select
              label="Member"
              value={form.memberId}
              disabled={Boolean(editing)}
              onChange={(event) => setForm((current) => ({ ...current, memberId: event.target.value }))}
              required
            >
              {members.map((member) => (
                <MenuItem key={member.id} value={member.id}>{member.fullName} · {member.memberCode}</MenuItem>
              ))}
            </TextField>
            {selectedMember && <Alert severity="info">Invoice will be assigned to {selectedMember.fullName} ({selectedMember.email}).</Alert>}
            <TextField
              label="Description"
              multiline
              minRows={3}
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              required
            />
            <TextField
              label="Amount"
              type="number"
              value={form.amount}
              onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
              slotProps={{ htmlInput: { min: 0.01, step: 0.01 } }}
              required
            />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Issue date"
                type="date"
                value={form.issueDate}
                onChange={(event) => setForm((current) => ({ ...current, issueDate: event.target.value }))}
                slotProps={{ inputLabel: { shrink: true } }}
                fullWidth
                required
              />
              <TextField
                label="Due date"
                type="date"
                value={form.dueDate}
                onChange={(event) => setForm((current) => ({ ...current, dueDate: event.target.value }))}
                slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: form.issueDate } }}
                fullWidth
                required
              />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={saving}>Close</Button>
          <Button variant="contained" onClick={() => void save()} disabled={saving}>
            {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create Invoice'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={Boolean(notice)} autoHideDuration={3000} onClose={() => setNotice('')} message={notice} />
    </>
  );
}
