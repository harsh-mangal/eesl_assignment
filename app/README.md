# Member Services — React Native CLI

This is the React Native CLI conversion of the original Expo application. The existing screens, API calls, Zustand stores, React Navigation flow, QR tickets, notifications, bookings, invoices, profile photo upload, icons, app icon, and splash screen are preserved.

## Included

- React Native 0.79.6 with TypeScript
- Native Android project in `android/`
- Native iOS project in `ios/`
- React Navigation 7
- Zustand persisted authentication
- Axios API client
- Camera and gallery profile-photo selection with `react-native-image-picker`
- QR rendering with `react-native-qrcode-svg`
- Native Ionicons through `react-native-vector-icons`
- Android adaptive/legacy launcher icons
- Android and iOS splash screens
- Android APK/AAB build scripts

## 1. Configure the API

Edit:

```text
src/config/env.ts
```

Default Android emulator URL:

```ts
export const API_BASE_URL = 'http://10.0.2.2:4001/api';
```

Common alternatives:

```text
iOS simulator: https://eesl.69.62.83.23.nip.io/api
Physical phone: http://YOUR_COMPUTER_LAN_IP:4001/api
Production: https://your-api-domain.com/api
```

Use HTTPS for production. Android cleartext traffic is currently enabled so the local HTTP development API works. Disable `android:usesCleartextTraffic` in `android/app/src/main/AndroidManifest.xml` after switching to HTTPS.

## 2. Install dependencies

```bash
npm install
```

For iOS on macOS:

```bash
cd ios
bundle install
bundle exec pod install
cd ..
```

## 3. Run the app

Start Metro:

```bash
npm start
```

In another terminal:

```bash
npm run android
```

For iOS:

```bash
npm run ios
```

## 4. Validation commands

```bash
npm run typecheck
npm run lint
npx react-native config
```

The lint command currently reports style warnings inherited from the source project, but no lint errors.

## 5. Build Android APK or AAB

Debug APK:

```bash
cd android
./gradlew assembleDebug
```

Output:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

Release APK:

```bash
npm run build:apk
```

Release AAB:

```bash
npm run build:aab
```

Outputs:

```text
android/app/build/outputs/apk/release/app-release.apk
android/app/build/outputs/bundle/release/app-release.aab
```

### Configure production signing

Generate a keystore:

```bash
keytool -genkeypair -v \
  -storetype PKCS12 \
  -keystore member-services-upload-key.keystore \
  -alias member-services \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

Place it in `android/app/`. Add these values to `~/.gradle/gradle.properties` so secrets are not committed:

```properties
MEMBER_SERVICES_UPLOAD_STORE_FILE=member-services-upload-key.keystore
MEMBER_SERVICES_UPLOAD_KEY_ALIAS=member-services
MEMBER_SERVICES_UPLOAD_STORE_PASSWORD=YOUR_STORE_PASSWORD
MEMBER_SERVICES_UPLOAD_KEY_PASSWORD=YOUR_KEY_PASSWORD
```

Without these properties, the release task uses the debug key only to make local testing builds possible. Do not publish a debug-signed build.

## 6. iOS signing

Open:

```text
ios/MemberServicesMobile.xcworkspace
```

Select the `MemberServicesMobile` target, choose your Apple Developer Team, confirm the bundle identifier `com.memberservices.app`, and archive from Xcode.

## Native identifiers

```text
Android applicationId: com.memberservices.app
iOS bundle identifier: com.memberservices.app
React Native module name: MemberServicesMobile
Display name: Member Services
```

## Permission configuration

Android:

- Internet
- Camera

iOS:

- Camera usage description
- Photo library usage description

## Important source locations

```text
App.tsx                         Root app component
src/navigation/AppNavigator.tsx Navigation and authentication flow
src/config/env.ts               API base URL
src/api/client.ts               Axios client and auth interceptor
src/store/authStore.ts          Persisted login/session state
src/screens/                    All application screens
android/                        Native Android project
ios/                            Native iOS project
```
