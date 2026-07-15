# Expo to React Native CLI migration notes

| Expo dependency/feature | React Native CLI replacement |
|---|---|
| `expo-status-bar` | React Native `StatusBar` |
| `@expo/vector-icons` | `react-native-vector-icons/Ionicons` |
| `expo-image-picker` | `react-native-image-picker` |
| Expo app configuration | Native Android Manifest/Gradle and iOS Info.plist/Xcode configuration |
| Expo icon and splash configuration | Generated Android mipmaps/adaptive icons and iOS asset catalogs/launch storyboard |
| `EXPO_PUBLIC_API_URL` | `src/config/env.ts` |
| EAS APK/AAB builds | Gradle `assembleRelease` and `bundleRelease` |

The business logic and screen structure were not redesigned. The conversion focuses on replacing Expo runtime dependencies and creating complete native projects.
