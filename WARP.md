# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is a React Native/Expo-based taxi application called "Three" that provides a complete ride-hailing solution with separate interfaces for passengers and drivers. The app uses Expo SDK 53 and includes real-time features, location tracking, and a comprehensive backend API.

## Development Commands

### Running the Application

```bash
# Install dependencies
npm install

# Start Expo development server
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios

# Run on web
npm run web
```

### API Server

```bash
# Navigate to API directory
cd api

# Install API dependencies
npm install

# Run API in development mode (with nodemon)
npm run dev

# Run API in production mode
npm start

# Run API tests
npm test
```

### Expo Updates (EAS)

```bash
# Push update to development branch
npm run update:dev

# Push update to preview branch
npm run update:preview

# Push update to production branch
npm run update:prod

# Build APK for development
eas build --platform android --profile development

# Build APK for preview
eas build --platform android --profile preview

# Build app bundle for production
eas build --platform android --profile production
```

### Testing

```bash
# Test the callback system
node test-callback-system.js

# Test driver password change functionality
node test-driver-password-change.js

# Test API endpoints
cd api && node test-api.js

# Test driver simulator
cd api && node test-driver-simulator.js

# Test complete integration
node test-integration.js
```

## Architecture Overview

### Frontend Structure

The application follows a modular architecture with clear separation of concerns:

1. **Navigation Architecture**
   - Uses React Navigation with Stack and Tab navigators
   - Two separate navigation flows: Passenger and Driver
   - Authentication state determines which flow is shown

2. **State Management**
   - UIContext provides global UI state management
   - Responsive design system adapts to different screen sizes
   - Keyboard state management for better UX

3. **Key Components**
   - **Modals**: Centralized modal system with variants (BaseModal)
   - **Screens**: Separate screens for passenger and driver functionality
   - **Responsive UI**: Dynamic sizing based on device characteristics
   - **Accessibility**: Dedicated accessibility components

4. **Service Layer**
   - `localDatabase.js`: Local storage management
   - `driverAuthService.js`: Driver authentication logic
   - Socket.io integration for real-time updates

### Backend API Architecture

The API is a Node.js/Express server with WebSocket support:

1. **Core Endpoints**
   - `/api/rides/*` - Ride management (request, accept, start, complete)
   - `/api/drivers/*` - Driver operations (register, status, location)
   - `/api/passengers/*` - Passenger management

2. **Real-time Features**
   - Socket.IO for WebSocket connections
   - Event-based communication for ride updates
   - Location tracking in real-time

3. **Data Flow**
   - Passengers request rides → Broadcast to nearby drivers
   - Drivers accept rides → Notify passenger
   - Real-time location updates during rides
   - State transitions: pending → accepted → in_progress → completed

### Database

- Uses Supabase for authentication and data persistence
- Local SQLite database for offline support
- SQL schemas in `/database` directory

### Design System

- Responsive sizing system with breakpoints (small, standard, large, tablet)
- Centralized theme configuration in `/config/theme.js`
- Performance optimizations for smooth animations
- Gesture engine for enhanced interactions

## Important Integration Points

1. **Location Services**
   - Uses expo-location for GPS tracking
   - Permissions handled in app.config.js
   - Real-time location updates via WebSocket

2. **Payment Integration**
   - Multiple payment methods supported (cash, card)
   - Payment confirmation flow in ride completion

3. **Push Notifications**
   - Driver notifications for new ride requests
   - Passenger notifications for ride status updates

4. **Maps Integration**
   - React Native Maps for map display
   - Route calculation and display
   - Driver/passenger location markers

## Key Configuration Files

- `app.config.js` - Expo configuration with app metadata
- `eas.json` - EAS Build configuration for different environments
- `babel.config.js` - Babel transpilation settings
- `metro.config.js` - Metro bundler configuration

## Environment-Specific Builds

The app supports three environments via EAS:
- **development**: Internal distribution, APK format
- **preview**: Internal testing, APK format  
- **production**: Play Store release, AAB format

Each environment has its own update channel for OTA updates.

## Common Development Patterns

1. **Modal Management**: Use the centralized modal system in `/components/BaseModal`
2. **Responsive Design**: Use `RESPONSIVE` utilities from `/config/theme`
3. **Error Handling**: Consistent toast notifications via `react-native-toast-message`
4. **Navigation**: Always use navigation props or hooks from React Navigation
5. **Real-time Updates**: Subscribe to Socket.IO events for live data

## API Testing

The API includes comprehensive test files for:
- Callback system verification
- Driver authentication flows
- Real-time ride simulations
- Integration testing across components

Use the provided test files to verify functionality during development.