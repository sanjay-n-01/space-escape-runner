# SpaceEscapeRunner

SpaceEscapeRunner is a simple mobile arcade game built with Expo and React Native where the player dodges falling asteroids, survives as long as possible, and tries to beat their high score.

## How to run

1. Clone the repository:
```bash
   git clone https://github.com/sanjay-n-01/space-escape-runner.git
   cd space-escape-runner
```
2. Install dependencies:
```bash
   npm install
```
3. Start the app:
```bash
   npx expo start
```
4. Open the Expo Go app on your phone and scan the QR code, or run it on an Android emulator.

## Features

- Fast-moving asteroid gameplay
- Left and right ship movement
- Score tracking
- High score saved locally using AsyncStorage
- Game over and replay flow

## Tech stack

- Expo
- React Native
- TypeScript

## Install APK

1. Build the Android APK using EAS:
```bash
   eas build -p android --profile preview
```
2. Download the generated APK from the EAS build dashboard.
3. Transfer the APK to your Android device, or open the download link on the device.
4. Allow installation from unknown sources if prompted.
5. Install the APK and open the game.

> Note: This install flow is for Android only. iOS apps must be installed through TestFlight or the App Store.

A prebuilt APK is available here, but Expo build links expire after a limited time (typically ~30 days). If this link no longer works, use the `eas build` command above to generate a fresh one:
https://expo.dev/accounts/sanjay01n/projects/SpaceEscapeRunner/builds/6da93efc-4ab6-4bc4-9579-97907de1b5d5