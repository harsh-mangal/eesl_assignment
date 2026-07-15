# Safe-area and dashboard navigation update

Changes included:

- Added `SafeAreaProvider` at the application root.
- Replaced the legacy React Native `SafeAreaView` with `react-native-safe-area-context`.
- Added top safe-area insets to all bottom-tab screens and the login screen.
- Added left, right and bottom safe-area protection to stack screens.
- Made bottom-tab height and padding respond to the device's navigation/gesture inset.
- Made every Home "At a glance" card clickable:
  - Outstanding invoices -> Invoices
  - Upcoming bookings -> My Bookings
  - Upcoming events -> Events
  - Unread notifications -> Notifications
- Added press feedback, accessibility roles and chevrons to clickable statistic cards.

Validation:

- `npm run typecheck` passed.
- React Native native-module autolinking passed.
- Android production Metro bundle completed successfully.
