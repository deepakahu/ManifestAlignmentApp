module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testMatch: [
    '**/__tests__/**/*.(ts|tsx|js)',
    '**/*.(test|spec).(ts|tsx|js)',
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/types/**/*',
    '!src/**/index.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/android/',
    '<rootDir>/ios/',
  ],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|react-native-vector-icons|@expo|expo|expo-modules-core|expo-device|expo-av|@react-navigation|react-navigation|@unimodules|unimodules|sentry-expo|native-base|react-clone-referenced-element|@react-native-community|react-native-svg|react-native-iphone-x-helper|react-native-super-grid|react-native-elements|react-native-modal|react-native-safe-area-context|react-native-reanimated|react-native-gesture-handler|react-native-screens|react-native-tab-view|react-native-pager-view|react-native-paper|react-native-elements|react-native-vector-icons|react-native-chart-kit)/)',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^expo-av$': '<rootDir>/src/__mocks__/expo-av.js',
    '\\.(mp3|wav|ogg|m4a)$': '<rootDir>/src/__mocks__/audio.js',
  },
  globals: {
    __DEV__: true,
  },
  testEnvironment: 'jsdom',
  testTimeout: 10000,
  collectCoverage: false,
  coverageThreshold: {
    global: {
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0,
    },
  },
  setupFiles: ['<rootDir>/jest.setup.js'],
};