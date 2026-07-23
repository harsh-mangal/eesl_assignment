import { ArrowBack, ShieldOutlined } from '@mui/icons-material';
import {
  AppBar,
  Box,
  Button,
  Container,
  Divider,
  Link,
  Paper,
  Stack,
  Toolbar,
  Typography,
} from '@mui/material';
import type { ReactNode } from 'react';
import { Link as RouterLink } from 'react-router-dom';

type LegalSection = {
  title: string;
  content: ReactNode;
};

type StaticLegalPageProps = {
  title: string;
  subtitle: string;
  effectiveDate: string;
  sections: LegalSection[];
};

export function StaticLegalPage({ title, subtitle, effectiveDate, sections }: StaticLegalPageProps) {
  return (
    <Box minHeight="100vh" bgcolor="#f6f8fb">
      <AppBar position="static" elevation={0} color="inherit" sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
        <Toolbar sx={{ gap: 1.5 }}>
          <ShieldOutlined color="primary" />
          <Typography variant="h6" fontWeight={800} sx={{ flexGrow: 1 }}>
            Member Services
          </Typography>
          <Button component={RouterLink} to="/login" startIcon={<ArrowBack />}>
            Admin login
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ py: { xs: 4, md: 7 } }}>
        <Paper variant="outlined" sx={{ borderRadius: 4, overflow: 'hidden' }}>
          <Box sx={{ p: { xs: 3, md: 5 }, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
            <Typography variant="h3" fontWeight={900} sx={{ fontSize: { xs: '2rem', md: '3rem' } }}>
              {title}
            </Typography>
            <Typography mt={1.5} sx={{ opacity: 0.9, maxWidth: 700 }}>
              {subtitle}
            </Typography>
            <Typography mt={2} variant="body2" sx={{ opacity: 0.85 }}>
              Effective date: {effectiveDate}
            </Typography>
          </Box>

          <Stack spacing={4} sx={{ p: { xs: 3, md: 5 } }} divider={<Divider flexItem />}>
            {sections.map((section) => (
              <Box key={section.title} component="section">
                <Typography variant="h5" fontWeight={800} mb={1.5}>
                  {section.title}
                </Typography>
                <Box color="text.secondary" sx={{ lineHeight: 1.8, '& ul': { pl: 3 }, '& li': { mb: 1 } }}>
                  {section.content}
                </Box>
              </Box>
            ))}
          </Stack>
        </Paper>

        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="center" spacing={2} mt={3}>
          <Link component={RouterLink} to="/privacy-policy">Privacy Policy</Link>
          <Link component={RouterLink} to="/terms-and-conditions">Terms &amp; Conditions</Link>
          <Link component={RouterLink} to="/account-deletion">Account Deletion</Link>
        </Stack>
        <Typography textAlign="center" color="text.secondary" variant="body2" mt={2}>
          © {new Date().getFullYear()} Member Services. All rights reserved.
        </Typography>
      </Container>
    </Box>
  );
}
