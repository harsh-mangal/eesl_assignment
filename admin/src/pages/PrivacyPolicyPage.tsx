import { Link, Typography } from '@mui/material';
import { StaticLegalPage } from '../components/StaticLegalPage';

export function PrivacyPolicyPage() {
  return (
    <StaticLegalPage
      title="Privacy Policy"
      subtitle="This policy explains how the Member Services application collects, uses, stores and protects information."
      effectiveDate="23 July 2026"
      sections={[
        {
          title: '1. Information we collect',
          content: (
            <>
              <Typography paragraph>We may process information required to provide membership and hospitality services, including:</Typography>
              <ul>
                <li>Name, member ID, email address, mobile number, address and profile photograph.</li>
                <li>Membership type, validity, status, digital card and RFID status.</li>
                <li>Restaurant, room and event bookings, tickets, QR verification and check-in records.</li>
                <li>Invoices, payment status, transaction references and receipts.</li>
                <li>Notifications, feedback, ratings and support-related information.</li>
                <li>Technical information such as authentication activity, application errors and device/network information required for security and troubleshooting.</li>
              </ul>
            </>
          ),
        },
        {
          title: '2. Camera and photo permissions',
          content: (
            <Typography paragraph>
              The mobile application may request camera or photo-library access only when a member chooses to upload a profile photograph. The Admin Panel may request camera access when an authorised administrator chooses to scan a membership or ticket QR code. Camera access is not used in the background.
            </Typography>
          ),
        },
        {
          title: '3. How information is used',
          content: (
            <ul>
              <li>Authenticate members and administrators and maintain secure sessions.</li>
              <li>Display membership details and the digital membership card.</li>
              <li>Process bookings, tickets, cancellations, check-ins and service feedback.</li>
              <li>Display invoices, payment history and transaction receipts.</li>
              <li>Send in-app announcements, booking updates and payment reminders.</li>
              <li>Prevent fraud, duplicate bookings, duplicate payments and repeated QR check-ins.</li>
              <li>Generate operational reports and improve service quality.</li>
            </ul>
          ),
        },
        {
          title: '4. Payments',
          content: (
            <Typography paragraph>
              The demonstration version of the application uses simulated payments. It does not collect or store complete debit-card, credit-card or bank-account details. If a production payment gateway is introduced, payment information will be processed according to the gateway provider’s privacy and security terms.
            </Typography>
          ),
        },
        {
          title: '5. Data sharing',
          content: (
            <Typography paragraph>
              Information is not sold. It may be shared only with authorised service providers, hosting providers, payment or communication providers, professional advisers, or government authorities when required for application operation, security, legal compliance or protection of rights.
            </Typography>
          ),
        },
        {
          title: '6. Data storage and security',
          content: (
            <Typography paragraph>
              Reasonable administrative and technical controls are used, including password hashing, authenticated APIs, role-based access, validation, restricted administrative access and secure transport on deployed environments. No internet-based system can guarantee absolute security.
            </Typography>
          ),
        },
        {
          title: '7. Data retention',
          content: (
            <Typography paragraph>
              Information is retained for as long as necessary to provide services, maintain required operational and financial records, resolve disputes, prevent misuse and satisfy legal obligations. Data that is no longer required may be deleted or anonymised.
            </Typography>
          ),
        },
        {
          title: '8. Your choices and rights',
          content: (
            <Typography paragraph>
              Members may review and update supported profile fields in the application. Requests concerning access, correction or deletion can be submitted through the organisation’s authorised support channel. Account deletion information is available on the <Link href="/account-deletion">Account Deletion page</Link>.
            </Typography>
          ),
        },
        {
          title: '9. Children’s privacy',
          content: (
            <Typography paragraph>
              The application is intended for registered members authorised by the organisation. It is not designed to knowingly collect information directly from children without appropriate organisational or guardian authorisation.
            </Typography>
          ),
        },
        {
          title: '10. Changes to this policy',
          content: (
            <Typography paragraph>
              This policy may be updated when application features, legal requirements or data practices change. The revised effective date will be displayed on this page.
            </Typography>
          ),
        },
        {
          title: '11. Contact',
          content: (
            <Typography paragraph>
              For privacy questions or requests, contact the organisation responsible for providing your Member Services account or use its official support channel.
            </Typography>
          ),
        },
      ]}
    />
  );
}
