import {
  LockOutlined,
  VisibilityOffOutlined,
  VisibilityOutlined,
} from '@mui/icons-material';
import {
  Alert,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Container,
  IconButton,
  InputAdornment,
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

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const cleanIdentifier = identifier.trim();

    if (!cleanIdentifier || !password) {
      setError('Enter your email address and password.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await login(cleanIdentifier, password);
      navigate('/', { replace: true });
    } catch (requestError) {
      setError(
        getApiError(
          requestError,
          'Unable to sign in. Please check your credentials.',
        ),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box
      minHeight="100vh"
      bgcolor="#F3F5F9"
      display="grid"
      sx={{ placeItems: 'center' }}
      px={2}
      py={4}
    >
      <Container maxWidth="xs" disableGutters>
        <Paper
          component="form"
          onSubmit={handleSubmit}
          variant="outlined"
          noValidate
          sx={{
            p: { xs: 3, sm: 4 },
            borderRadius: 4,
            borderColor: 'divider',
          }}
        >
          <Avatar
            sx={{
              bgcolor: 'primary.main',
              width: 52,
              height: 52,
              mx: 'auto',
              mb: 2,
            }}
          >
            <LockOutlined />
          </Avatar>

          <Typography
            variant="h4"
            component="h1"
            textAlign="center"
            fontWeight={800}
          >
            Admin Login
          </Typography>

          <Typography
            textAlign="center"
            color="text.secondary"
            mt={1}
            mb={3}
          >
            Sign in securely to manage members, services and transactions.
          </Typography>

          {error && (
            <Alert
              severity="error"
              onClose={() => setError('')}
              sx={{ mb: 2 }}
            >
              {error}
            </Alert>
          )}

          <TextField
            fullWidth
            label="Email address"
            type="email"
            value={identifier}
            onChange={(event) => {
              setIdentifier(event.target.value);
              if (error) setError('');
            }}
            margin="normal"
            autoComplete="username"
            autoFocus
            required
            disabled={submitting}
            inputProps={{
              autoCapitalize: 'none',
              spellCheck: false,
            }}
          />

          <TextField
            fullWidth
            label="Password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              if (error) setError('');
            }}
            margin="normal"
            autoComplete="current-password"
            required
            disabled={submitting}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    type="button"
                    edge="end"
                    disabled={submitting}
                    aria-label={
                      showPassword ? 'Hide password' : 'Show password'
                    }
                    onClick={() => setShowPassword((current) => !current)}
                  >
                    {showPassword ? (
                      <VisibilityOffOutlined />
                    ) : (
                      <VisibilityOutlined />
                    )}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Button
            type="submit"
            fullWidth
            size="large"
            variant="contained"
            disabled={submitting}
            sx={{
              mt: 2.5,
              minHeight: 48,
              py: 1.25,
              fontWeight: 700,
            }}
          >
            {submitting ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'Sign in'
            )}
          </Button>
        </Paper>
      </Container>
    </Box>
  );
}