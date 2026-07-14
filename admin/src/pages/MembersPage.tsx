import { RefreshOutlined, SearchOutlined } from '@mui/icons-material';
import {
  Alert,
  Avatar,
  Box,
  Chip,
  CircularProgress,
  IconButton,
  InputAdornment,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import { api, getApiError } from '../api/client';
import { PageHeader } from '../components/PageHeader';
import type { ApiResponse, Member } from '../types/api';

type MemberListResponse = {
  items: Member[];
  pagination: { total: number };
};

export function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadMembers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get<ApiResponse<MemberListResponse>>('/admin/members', {
        params: { search: search || undefined, page: 1, limit: 50 },
      });
      setMembers(response.data.data.items);
    } catch (requestError) {
      setError(getApiError(requestError));
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadMembers(), 300);
    return () => window.clearTimeout(timer);
  }, [loadMembers]);

  return (
    <>
      <PageHeader
        title="Members"
        subtitle="Search members and review membership and RFID states."
        action={
          <IconButton onClick={() => void loadMembers()} aria-label="Refresh members">
            <RefreshOutlined />
          </IconButton>
        }
      />
      <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Box p={2} borderBottom="1px solid" borderColor="divider">
          <TextField
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name, member ID, email or phone"
            size="small"
            fullWidth
            sx={{ maxWidth: 520 }}
            InputProps={{
              startAdornment: <InputAdornment position="start"><SearchOutlined /></InputAdornment>,
            }}
          />
        </Box>
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
                </TableRow>
              </TableHead>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.id} hover>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1.25}>
                        <Avatar src={member.profilePhotoUrl ?? undefined}>{member.fullName[0]}</Avatar>
                        <Typography fontWeight={700}>{member.fullName}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{member.memberCode}</TableCell>
                    <TableCell>
                      <Typography variant="body2">{member.email}</Typography>
                      <Typography variant="caption" color="text.secondary">{member.mobileNumber}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={`${member.membership?.membershipType ?? '—'} · ${member.membership?.status ?? '—'}`}
                        color={member.membership?.status === 'ACTIVE' ? 'success' : 'default'}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={member.rfidRecord?.status ?? 'Not assigned'}
                        color={member.rfidRecord?.status === 'ACTIVE' ? 'success' : member.rfidRecord?.status === 'BLOCKED' ? 'error' : 'default'}
                      />
                    </TableCell>
                    <TableCell>
                      {member.membership?.validUntil
                        ? new Date(member.membership.validUntil).toLocaleDateString()
                        : '—'}
                    </TableCell>
                  </TableRow>
                ))}
                {members.length === 0 && (
                  <TableRow><TableCell colSpan={6} align="center" sx={{ py: 6 }}>No members found.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </>
  );
}
