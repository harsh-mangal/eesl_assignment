import { CloudUploadOutlined, DeleteOutline } from '@mui/icons-material';
import { Box, Button, Stack, Typography } from '@mui/material';
import { useEffect, useId, useMemo } from 'react';

const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
const maxBytes = 5 * 1024 * 1024;

type Props = {
  label: string;
  value?: string | null;
  file: File | null;
  onFileChange: (file: File | null) => void;
  onError?: (message: string) => void;
  aspectRatio?: string;
};

export function ImageUploadField({
  label,
  value,
  file,
  onFileChange,
  onError,
  aspectRatio = '16 / 9',
}: Props) {
  const inputId = useId();
  const objectUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  const preview = objectUrl || value || null;

  useEffect(() => () => {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  }, [objectUrl]);

  const choose = (selected?: File) => {
    if (!selected) return;
    if (!allowedTypes.has(selected.type)) {
      onError?.('Only JPEG, PNG and WebP images are supported.');
      return;
    }
    if (selected.size > maxBytes) {
      onError?.('Image size must be 5 MB or less.');
      return;
    }
    onFileChange(selected);
  };

  return (
    <Stack spacing={1}>
      <Typography variant="subtitle2" fontWeight={700}>{label}</Typography>
      <Box
        sx={{
          width: '100%',
          maxWidth: 620,
          aspectRatio,
          border: '1px dashed',
          borderColor: 'divider',
          borderRadius: 2.5,
          overflow: 'hidden',
          bgcolor: 'grey.50',
          display: 'grid',
          placeItems: 'center',
        }}
      >
        {preview ? (
          <Box component="img" src={preview} alt={`${label} preview`} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <Stack alignItems="center" spacing={1} color="text.secondary">
            <CloudUploadOutlined />
            <Typography variant="body2">Select an image to preview</Typography>
          </Stack>
        )}
      </Box>
      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
        <Button component="label" htmlFor={inputId} variant="outlined" startIcon={<CloudUploadOutlined />}>
          {preview ? 'Choose another image' : 'Choose image'}
        </Button>
        <input
          id={inputId}
          hidden
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(event) => {
            choose(event.target.files?.[0]);
            event.currentTarget.value = '';
          }}
        />
        {file && (
          <Button color="inherit" startIcon={<DeleteOutline />} onClick={() => onFileChange(null)}>
            Discard selection
          </Button>
        )}
        <Typography variant="caption" color="text.secondary">JPEG, PNG or WebP · maximum 5 MB</Typography>
      </Stack>
    </Stack>
  );
}
