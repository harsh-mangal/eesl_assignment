import { Alert, Typography } from '@mui/material';
import { StaticLegalPage } from '../components/StaticLegalPage';

export function AccountDeletionPage() {
  return (
    <StaticLegalPage
      title="Account Deletion"
      subtitle="Instructions for requesting deletion of a Member Services account and associated personal information."
      effectiveDate="23 July 2026"
      sections={[
        {
          title: 'How to request deletion',
          content: (
            <>
              <Typography paragraph>Submit a deletion request through the official support channel of the organisation that issued your membership. Include:</Typography>
              <ul>
                <li>Your full name.</li>
                <li>Your Member ID.</li>
                <li>Your registered email address or mobile number.</li>
                <li>A clear request to delete the Member Services account.</li>
              </ul>
              <Alert severity="info" sx={{ mt: 2 }}>
                For security, the organisation may verify your identity before processing the request.
              </Alert>
            </>
          ),
        },
        {
          title: 'What may be deleted',
          content: (
            <Typography paragraph>
              Subject to verification and applicable requirements, profile details, authentication access, notification records and other information no longer required for legitimate operational purposes may be deleted or anonymised.
            </Typography>
          ),
        },
        {
          title: 'Information that may be retained',
          content: (
            <Typography paragraph>
              Booking, invoice, payment, audit, fraud-prevention or legal records may be retained when necessary for accounting, security, dispute resolution, contractual obligations or compliance with law. Retained information will remain restricted to those purposes.
            </Typography>
          ),
        },
        {
          title: 'Effect of deletion',
          content: (
            <Typography paragraph>
              Once deletion is completed, access to the mobile application, digital membership card, bookings, tickets, invoices and notifications may no longer be available. Some records may not be recoverable.
            </Typography>
          ),
        },
        {
          title: 'Processing time',
          content: (
            <Typography paragraph>
              The organisation will review verified requests within a reasonable period. Additional time may be required when records must be retained or when the request affects an active membership or unresolved transaction.
            </Typography>
          ),
        },
      ]}
    />
  );
}
