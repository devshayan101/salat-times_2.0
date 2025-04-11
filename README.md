# Salat Time App

This is a React Native/Expo mobile application called "SalatTimes" designed to help Muslims track their daily prayers. Here are the key features:

## Core Functionality

Displays accurate prayer times based on user's location
Qibla direction finder with compass integration
Tasbih (prayer bead) counter
Hijri Calendar integration
Prayer time notifications

## Additional Features

Admin message system
Customizable settings (calculation methods, notification sounds)
Multiple madhab support (Hanafi/Shafi calculations)
Donation system
Dark/light theme support

## Technical Stack

React Native with Expo framework
TypeScript for type safety
MongoDB integration for admin messages
Location services for prayer times and qibla
Expo notifications for prayer alerts

## Development

This app is built using React Native and Expo.

### Setup

1. Clone the repository.
2. Install dependencies: `npm install`
3. Run the app: `npx expo start`

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
