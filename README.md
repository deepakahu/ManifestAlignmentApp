# Manifestation Alignment App

A comprehensive React Native application for mood tracking, manifestation practice, and personal development with an innovative 30-day trial system and freemium model.

## 🌟 Features

### Core Features
- **Mood Tracking**: Advanced mood logging with 1-5 scale, tags, notes, and trend analysis
- **Manifestation Management**: Create, view, and track manifestations with categories, affirmations, and visualization notes
- **Smart Alarms**: Customizable reminder system with flexible intervals and ambient sounds
- **Reading Mode**: Immersive manifestation reading experience with swipe navigation
- **Progress Analytics**: Comprehensive tracking and insights into mood patterns and manifestation progress

### Premium System
- **30-Day Trial**: Full access to all features with smart conversion psychology
- **Freemium Model**: Limited features for free users (1 alarm, 3 manifestations, 7-day mood history)
- **Progressive Trial Reminders**: Psychology-based prompts at strategic intervals (Day 7, 15, 23, 28, 30)
- **Usage Analytics**: Trial engagement tracking and conversion likelihood scoring
- **Smooth Transitions**: Seamless upgrade flows and post-trial conversion screens

### Advanced Features
- **Sound Integration**: Multiple ambient sounds (Singing Bowl, Tibetan Bowl, Ambient Piano, etc.)
- **Data Persistence**: Reliable local storage with AsyncStorage
- **Export Functionality**: Complete data export capabilities
- **Notification System**: Smart push notifications with alarm integration
- **Navigation**: Bottom tabs + stack navigation with deep linking support

## 🏗️ Project Structure

```
ManifestExpo/
├── src/
│   ├── components/           # Reusable UI components
│   │   └── common/          # Common components (PremiumGate, TrialBanner, etc.)
│   ├── context/             # React Context providers
│   │   ├── AppContext.tsx   # Global app state
│   │   └── PremiumContext.tsx # Premium/trial logic
│   ├── hooks/               # Custom React hooks
│   │   ├── useTrialReminders.ts
│   │   └── useStrategicUpgradePrompts.ts
│   ├── navigation/          # Navigation configuration
│   │   └── AppNavigator.tsx # Main navigation setup
│   ├── screens/             # Screen components
│   │   ├── Home/           # Dashboard and main screen
│   │   ├── MoodTracking/   # Mood entry and analytics
│   │   ├── Manifestation/  # Manifestation CRUD operations
│   │   ├── AlarmSetup/     # Alarm configuration
│   │   ├── Premium/        # Trial and premium screens
│   │   └── Settings/       # App configuration
│   ├── services/           # Business logic services
│   │   ├── AlarmService.ts # Alarm scheduling and management
│   │   ├── TrialService.ts # 30-day trial tracking
│   │   ├── UpgradeAnalytics.ts # Conversion analytics
│   │   ├── notifications/  # Push notification handling
│   │   └── storage/        # Data persistence layer
│   ├── types/              # TypeScript type definitions
│   └── utils/              # Utility functions
├── assets/                 # Static assets
│   └── sounds/            # Audio files for alarms
├── __tests__/             # Test files
└── coverage/              # Test coverage reports
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- React Native development environment set up
- Expo CLI installed globally
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

### Installation

1. **Clone the repository**
   ```bash
   git clone [repository-url]
   cd ManifestAlignmentApp/ManifestExpo
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Run on platforms**
   ```bash
   # Android
   npm run android

   # iOS  
   npm run ios

   # Web
   npm run web
   ```

## 🧪 Testing

### Test Scripts
```bash
# Run all tests
npm test

# Watch mode for development
npm run test:watch

# Generate coverage report
npm run test:coverage

# CI/CD testing
npm run test:ci

# Unit tests only
npm run test:unit

# Integration tests
npm run test:integration

# End-to-end tests
npm run test:e2e

# Debug tests
npm run test:debug
```

### Test Coverage
- **Current Coverage**: 43%+ across all modules
- **Test Files**: 145+ test cases covering:
  - Core business logic (mood tracking, manifestations, alarms)
  - Premium/trial system functionality
  - Navigation and routing
  - Data persistence and storage
  - Component rendering and user interactions

### Key Test Areas
- **Trial System Testing**: 30-day trial tracking, conversion flows, usage analytics
- **Freemium Limitations**: Alarm limits, manifestation caps, mood history restrictions
- **End-to-End Flows**: Complete user journeys from alarm → notification → mood → manifestation
- **Data Persistence**: Storage service reliability and data integrity
- **Sound Integration**: Audio preview and playback functionality

## 🎯 Core User Flows

### 1. Trial User Journey
1. **App Install**: Automatic 30-day trial activation
2. **Full Access**: All premium features unlocked
3. **Progressive Reminders**: Strategic conversion prompts
4. **Usage Tracking**: Analytics on engagement patterns
5. **Trial End**: Conversion screen with personalized messaging
6. **Freemium Transition**: Graceful downgrade to limited features

### 2. Mood Tracking Flow
1. **Alarm Trigger**: Scheduled notification fires
2. **Mood Entry**: User selects mood (1-5 scale) with notes/tags
3. **Manifestation Reading**: Optional post-mood manifestation review
4. **Analytics Update**: Trend analysis and insights generation

### 3. Manifestation Management
1. **Creation**: Title, description, category, affirmations, visualization notes
2. **Organization**: Category-based filtering and management
3. **Reading Mode**: Immersive experience with swipe navigation
4. **Progress Tracking**: Completion status and usage analytics

## 📊 Analytics & Insights

### Trial Analytics
- **Conversion Likelihood**: ML-based scoring using usage patterns
- **Engagement Metrics**: Feature usage, session duration, retention
- **Strategic Prompts**: Psychology-based reminder timing
- **Usage Insights**: Most used features, engagement levels

### Mood Analytics
- **Trend Analysis**: 7-day, monthly, and all-time patterns
- **Visual Charts**: Line graphs with react-native-chart-kit
- **Pattern Recognition**: Identifying mood trends and triggers
- **Limited History**: 7-day limit for free users, unlimited for trial/premium

## 🔊 Sound System

### Available Sounds
- Ambient Piano
- Singing Bowl
- Singing Bowl Hit
- Tibetan Bowl Low
- Calm Music
- Relaxing Guitar

### Features
- **Preview Functionality**: Test sounds before setting alarms
- **Volume Control**: Adjustable notification volume
- **Custom Selection**: Per-alarm sound customization

## 💾 Data Management

### Storage Architecture
- **AsyncStorage**: Primary data persistence layer
- **Structured Data**: Type-safe data models with TypeScript
- **Export/Import**: Complete data portability
- **Backup Strategy**: Local storage with export capabilities

### Data Types
- **User Preferences**: Settings, notifications, theme
- **Mood Entries**: Historical mood data with metadata
- **Manifestations**: Complete manifestation records
- **Alarms**: Scheduling and configuration data
- **Trial Data**: Usage patterns and conversion metrics

## 🔐 Premium Features

### Trial Period (30 Days)
- ✅ Unlimited manifestations
- ✅ Unlimited alarms
- ✅ Complete mood history
- ✅ Advanced analytics
- ✅ All sound options
- ✅ Export functionality

### Free Version
- ❌ 1 alarm maximum
- ❌ 3 manifestations maximum
- ❌ 7-day mood history only
- ❌ Limited analytics
- ❌ Basic sounds only
- ❌ No export

### Premium Upgrade
- ✅ All trial features permanently
- ✅ Priority support
- ✅ Future feature access
- ✅ Ad-free experience

## 🚀 Deployment

### Build Configuration
- **Expo Application Services (EAS)**: Configured for streamlined builds
- **Platform Support**: Android and iOS native builds
- **Environment Management**: Development, staging, and production configs

### Release Process
1. **Testing**: Complete test suite validation
2. **Build**: EAS build generation
3. **Staging**: Internal testing and validation
4. **Release**: App store deployment

## 🛠️ Development

### Code Quality
- **TypeScript**: Full type safety throughout the application
- **ESLint**: Code linting and style enforcement
- **Prettier**: Consistent code formatting
- **Jest**: Comprehensive testing framework

### Development Workflow
1. **Feature Development**: Component-driven development approach
2. **Testing**: Test-driven development with high coverage goals
3. **Code Review**: Rigorous review process for all changes
4. **Integration Testing**: End-to-end validation before release

## 📱 Platform Support

### Supported Platforms
- **Android**: Android 6.0+ (API level 23+)
- **iOS**: iOS 12.0+
- **Web**: Modern browsers (development/testing)

### Device Features
- **Push Notifications**: Local and scheduled notifications
- **Audio Playback**: Background audio support
- **Storage**: Local data persistence
- **Navigation**: Deep linking and URL schemes

## 🎨 Design System

### UI/UX Principles
- **Material Design**: Following Android design guidelines
- **iOS Human Interface**: Native iOS design patterns
- **Accessibility**: WCAG 2.1 compliance
- **Responsive Design**: Adaptive layouts for different screen sizes

### Color Palette
- **Primary**: #6366f1 (Indigo)
- **Success**: #10b981 (Emerald)
- **Warning**: #f59e0b (Amber)
- **Error**: #ef4444 (Red)
- **Background**: #f8fafc (Slate)

## 🔄 State Management

### Context Architecture
- **AppContext**: Global application state (moods, manifestations, alarms)
- **PremiumContext**: Trial and premium feature management
- **Navigation State**: React Navigation state management

### Data Flow
1. **Service Layer**: Business logic and API interactions
2. **Context Layer**: State management and distribution
3. **Component Layer**: UI rendering and user interactions
4. **Storage Layer**: Data persistence and retrieval

## 📈 Performance

### Optimization Strategies
- **Lazy Loading**: Dynamic imports for screens and components
- **Memoization**: React.memo and useMemo for expensive operations
- **Efficient Rendering**: FlatList for large data sets
- **Image Optimization**: Appropriate sizing and caching

### Monitoring
- **Performance Metrics**: Frame rate and memory usage tracking
- **Crash Reporting**: Error boundary implementation
- **Analytics**: User behavior and app performance insights

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make changes with appropriate tests
4. Ensure all tests pass
5. Submit a pull request

### Coding Standards
- Follow existing TypeScript and React Native patterns
- Write comprehensive tests for new features
- Maintain documentation for significant changes
- Follow semantic versioning for releases

## 📄 License

This project is proprietary software. All rights reserved.

## 📞 Support

For support and questions:
- Review the troubleshooting section
- Check existing issues
- Contact the development team

---

**Built with ❤️ using React Native and Expo**