# Salat Time App

This is a mobile application designed to help users keep track of daily prayer (Salat) times.

## Features

*   Displays accurate daily prayer times based on location.
*   Qibla direction finder.
*   Tasbih counter.
*   Hijri Calendar integration.
*   Notifications for prayer times.
*   Admin messages/updates.
*   Customizable settings (e.g., calculation methods, notification sounds).

## Development

This app is built using React Native and Expo.

### Setup

1.  Clone the repository.
2.  Install dependencies: `npm install`
3.  Run the app: `npx expo start`

## Troubleshooting

### Build Error: `androidx.compose.compiler`

If you encounter a build error related to `androidx.compose.compiler` during the Android build process, you might need to force a specific version.

Add the following configuration block inside the `allprojects` block in your `android/build.gradle` file:

```gradle
configurations.all {
    resolutionStrategy {
        force "androidx.compose.compiler:compiler:1.5.3"
    }
}
```

This ensures that the specified version of the Compose compiler is used, which can resolve compatibility issues.
