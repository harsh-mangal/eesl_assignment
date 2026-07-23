import { Typography } from '@mui/material';
import { StaticLegalPage } from '../components/StaticLegalPage';

export function TermsAndConditionsPage() {
  return (
    <StaticLegalPage
      title="Terms & Conditions"
      subtitle="These terms govern access to and use of the Member Services mobile application and administrative website."
      effectiveDate="23 July 2026"
      sections={[
        { title: '1. Acceptance', content: <Typography paragraph>By signing in or using the application, you agree to these terms and any applicable membership or organisational rules.</Typography> },
        { title: '2. Authorised access', content: <Typography paragraph>Accounts are for authorised members and administrators only. Login credentials must be kept confidential and must not be shared or used to access another person’s information.</Typography> },
        { title: '3. Membership services', content: <Typography paragraph>Features and access depend on membership status, validity, RFID status, service availability and organisational approval. Inactive or expired memberships may be restricted.</Typography> },
        { title: '4. Bookings and tickets', content: <Typography paragraph>Bookings remain subject to availability, capacity, applicable charges and cancellation rules. QR tickets and membership codes are unique and must not be copied, transferred or reused without authorisation.</Typography> },
        { title: '5. Payments', content: <Typography paragraph>The current demonstration build uses simulated payment flows. Production transactions, where enabled, may also be governed by a third-party payment provider’s terms.</Typography> },
        { title: '6. Acceptable use', content: <Typography paragraph>You must not attempt unauthorised access, interfere with the service, manipulate bookings or payments, misuse QR codes, upload harmful content, or use the application unlawfully.</Typography> },
        { title: '7. Availability and changes', content: <Typography paragraph>The organisation may update, suspend or discontinue functionality, availability, content or services. Maintenance and network conditions may temporarily affect access.</Typography> },
        { title: '8. Limitation of responsibility', content: <Typography paragraph>To the extent permitted by law, the organisation is not responsible for indirect loss caused by unavailable services, incorrect user-supplied information, device issues or third-party systems outside its reasonable control.</Typography> },
        { title: '9. Suspension or termination', content: <Typography paragraph>Access may be suspended or terminated for expired membership, security concerns, misuse, legal requirements or violation of these terms.</Typography> },
        { title: '10. Contact', content: <Typography paragraph>Questions about these terms should be sent through the official support channel of the organisation providing the Member Services account.</Typography> },
      ]}
    />
  );
}
