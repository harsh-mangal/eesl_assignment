import { Box, Paper, Typography } from '@mui/material';
import type { ReactNode } from 'react';

export function StatCard({ label, value, icon }: { label: string; value: number | string; icon: ReactNode }) {
  return (
    <Paper variant="outlined" sx={{ p: 2.25, borderRadius: 3, height: '100%' }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" gap={2}>
        <Box>
          <Typography color="text.secondary" variant="body2">
            {label}
          </Typography>
          <Typography variant="h5" fontWeight={800} mt={0.5}>
            {value}
          </Typography>
        </Box>
        <Box
          width={44}
          height={44}
          display="grid"
          sx={{ placeItems: 'center', borderRadius: 2.5, bgcolor: 'primary.50', color: 'primary.main' }}
        >
          {icon}
        </Box>
      </Box>
    </Paper>
  );
}
