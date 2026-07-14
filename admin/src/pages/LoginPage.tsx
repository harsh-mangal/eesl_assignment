import { LockOutlined } from '@mui/icons-material';
import {
  Alert,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Container,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import { FormEvent, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { getApiError } from '../api/client';
import { useAuth } from '../context/AuthContext';

export function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('admin@memberservices.test');
  const [password, setPassword] = useState('Admin@123');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await login(identifier, password);
      navigate('/', { replace: true });
    } catch (requestError) {
      setError(getApiError(requestError, 'Unable to sign in.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box minHeight="100vh" bgcolor="#f3f5f9" display="grid" sx={{ placeItems: 'center' }} py={4}>
      <Container maxWidth="xs">
        <Paper component="form" onSubmit={handleSubmit} variant="outlined" sx={{ p: 4, borderRadius: 4 }}>
          <Avatar sx={{ bgcolor: 'primary.main', mx: 'auto', mb: 2 }}>
            <LockOutlined />
          </Avatar>
          <Typography variant="h4" textAlign="center" fontWeight={800}>
            Admin Login
          </Typography>
          <Typography textAlign="center" color="text.secondary" mt={1} mb={3}>
            Manage members, services and transactions.
          </Typography>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <TextField
            fullWidth
            label="Email address"
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            margin="normal"
            autoComplete="username"
            required
          />
          <TextField
            fullWidth
            label="Password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            margin="normal"
            autoComplete="current-password"
            required
          />
          <Button
            type="submit"
            fullWidth
            size="large"
            variant="contained"
            disabled={submitting}
            sx={{ mt: 2, py: 1.25 }}
          >
            {submitting ? <CircularProgress size={24} color="inherit" /> : 'Sign in'}
          </Button>
        </Paper>
      </Container>
    </Box>
  );
}
