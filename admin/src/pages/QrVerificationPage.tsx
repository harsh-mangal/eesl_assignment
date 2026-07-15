import { BrowserQRCodeReader, type IScannerControls } from '@zxing/browser';
import {
  CameraAltOutlined,
  CheckCircleOutline,
  CloseOutlined,
  QrCodeScannerOutlined,
  SearchOutlined,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useCallback, useEffect, useRef, useState } from 'react';
import { api, getApiError } from '../api/client';
import { PageHeader } from '../components/PageHeader';
import type { ApiResponse, QrVerification } from '../types/api';

export function QrVerificationPage() {
  const [token, setToken] = useState('');
  const [result, setResult] = useState<QrVerification | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [cameraStarting, setCameraStarting] = useState(false);
  const [scanMessage, setScanMessage] = useState('');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scannerControlsRef = useRef<IScannerControls | null>(null);

  const stopCamera = useCallback(() => {
    scannerControlsRef.current?.stop();
    scannerControlsRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraStarting(false);
  }, []);

  useEffect(() => {
    if (!cameraOpen) {
      stopCamera();
      return undefined;
    }

    let disposed = false;
    const startCamera = async () => {
      setCameraError('');
      setScanMessage('');
      setCameraStarting(true);

      if (!window.isSecureContext && window.location.hostname !== 'localhost') {
        setCameraError('Camera access requires HTTPS, except when the Admin Panel is opened on localhost.');
        setCameraStarting(false);
        return;
      }
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError('This browser does not support camera access. Use manual token entry instead.');
        setCameraStarting(false);
        return;
      }

      try {
        const reader = new BrowserQRCodeReader(undefined, {
          delayBetweenScanAttempts: 180,
          delayBetweenScanSuccess: 700,
        });
        const controls = await reader.decodeFromConstraints(
          {
            audio: false,
            video: {
              facingMode: { ideal: 'environment' },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
          },
          videoRef.current ?? undefined,
          (scanResult, _scanError, callbackControls) => {
            if (!scanResult || disposed) return;
            const scannedToken = scanResult.getText().trim();
            if (!scannedToken) return;

            setToken(scannedToken);
            setResult(null);
            setError('');
            setScanMessage('QR token captured. Choose Verify only or Verify & check in.');
            callbackControls.stop();
            scannerControlsRef.current = null;
            setCameraStarting(false);
            setCameraOpen(false);
          },
        );

        if (disposed) {
          controls.stop();
          return;
        }
        scannerControlsRef.current = controls;
        setCameraStarting(false);
      } catch (cameraRequestError) {
        const message = cameraRequestError instanceof Error ? cameraRequestError.message : 'Unable to start the camera.';
        if (!disposed) {
          setCameraError(
            /permission|notallowed|denied/i.test(message)
              ? 'Camera permission was denied. Allow camera access in the browser or use manual token entry.'
              : message,
          );
          setCameraStarting(false);
        }
      }
    };

    void startCamera();
    return () => {
      disposed = true;
      stopCamera();
    };
  }, [cameraOpen, stopCamera]);

  const verify = async (checkIn: boolean) => {
    if (!token.trim()) {
      setError('Scan, enter or paste a QR token.');
      return;
    }
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const response = await api.post<ApiResponse<QrVerification>>('/admin/qr/verify', {
        token: token.trim(),
        checkIn,
      });
      setResult(response.data.data);
    } catch (requestError) {
      setError(getApiError(requestError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHeader
        title="QR Verification"
        subtitle="Scan or enter membership, restaurant-reservation and event-ticket QR codes. Event tickets can be checked in once only."
      />
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {scanMessage && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setScanMessage('')}>{scanMessage}</Alert>}

      <Paper variant="outlined" sx={{ borderRadius: 3, p: { xs: 2, md: 3 }, maxWidth: 900 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} mb={2}>
          <Button
            variant={cameraOpen ? 'contained' : 'outlined'}
            startIcon={cameraOpen ? <CloseOutlined /> : <CameraAltOutlined />}
            onClick={() => setCameraOpen((open) => !open)}
          >
            {cameraOpen ? 'Close camera' : 'Scan with camera'}
          </Button>
          <Typography variant="body2" color="text.secondary" alignSelf={{ sm: 'center' }}>
            Point the rear camera at the complete QR code and hold steady.
          </Typography>
        </Stack>

        {cameraOpen && (
          <Box mb={3}>
            {cameraError && <Alert severity="warning" sx={{ mb: 1.5 }}>{cameraError}</Alert>}
            <Box
              sx={{
                position: 'relative',
                width: '100%',
                maxWidth: 620,
                aspectRatio: '4 / 3',
                overflow: 'hidden',
                borderRadius: 3,
                bgcolor: '#101828',
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Box
                component="video"
                ref={videoRef}
                muted
                playsInline
                sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
              {!cameraError && (
                <Box
                  sx={{
                    position: 'absolute',
                    inset: '14%',
                    border: '3px solid rgba(255,255,255,0.9)',
                    borderRadius: 2,
                    boxShadow: '0 0 0 999px rgba(16,24,40,0.28)',
                    pointerEvents: 'none',
                  }}
                />
              )}
              {cameraStarting && (
                <Box
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    display: 'grid',
                    placeItems: 'center',
                    bgcolor: 'rgba(16,24,40,0.55)',
                  }}
                >
                  <Stack alignItems="center" spacing={1}>
                    <CircularProgress sx={{ color: '#fff' }} />
                    <Typography color="#fff">Starting camera…</Typography>
                  </Stack>
                </Box>
              )}
            </Box>
          </Box>
        )}

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ md: 'center' }}>
          <TextField
            fullWidth
            label="QR token"
            placeholder="Scan a QR code or paste its token"
            value={token}
            onChange={(event) => {
              setToken(event.target.value);
              setResult(null);
              setScanMessage('');
            }}
            multiline
            minRows={2}
          />
          <Stack spacing={1} minWidth={{ md: 210 }}>
            <Button variant="outlined" startIcon={<SearchOutlined />} disabled={loading} onClick={() => void verify(false)}>
              Verify only
            </Button>
            <Button variant="contained" startIcon={<CheckCircleOutline />} disabled={loading} onClick={() => void verify(true)}>
              Verify & check in
            </Button>
          </Stack>
        </Stack>
        <Typography variant="caption" color="text.secondary" display="block" mt={1.5}>
          Manual token entry remains available when the device has no camera or browser permission is unavailable.
        </Typography>

        {loading && <Box py={5} display="grid" sx={{ placeItems: 'center' }}><CircularProgress /></Box>}
        {result && !loading && (
          <Card variant="outlined" sx={{ mt: 3, borderColor: result.valid ? 'success.light' : 'error.light' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <QrCodeScannerOutlined color={result.valid ? 'success' : 'error'} />
                <Box>
                  <Typography variant="h6" fontWeight={900}>
                    {result.valid ? (result.checkedIn ? 'Ticket checked in' : 'Valid QR') : 'Invalid QR'}
                  </Typography>
                  <Typography color="text.secondary">{result.reason}</Typography>
                </Box>
                <Chip sx={{ ml: 'auto' }} label={result.currentStatus ?? 'UNKNOWN'} color={result.valid ? 'success' : 'error'} />
              </Stack>
              <Divider sx={{ my: 2 }} />
              <Stack spacing={1}>
                <Typography><strong>QR type:</strong> {result.qrType ?? 'Unknown'}</Typography>
                <Typography><strong>Member:</strong> {result.member ? `${result.member.fullName} (${result.member.memberCode})` : 'Not available'}</Typography>
                {result.booking && 'bookingNumber' in result.booking && <Typography><strong>Booking:</strong> {result.booking.bookingNumber}</Typography>}
                {result.booking && 'ticketNumber' in result.booking && <Typography><strong>Ticket:</strong> {result.booking.ticketNumber}</Typography>}
              </Stack>
            </CardContent>
          </Card>
        )}
      </Paper>
    </>
  );
}
