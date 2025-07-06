// Mock for @react-navigation/native
export const useNavigation = jest.fn(() => ({
  navigate: jest.fn(),
  goBack: jest.fn(),
  dispatch: jest.fn(),
  setOptions: jest.fn(),
  isFocused: jest.fn(() => true),
  addListener: jest.fn(),
  removeListener: jest.fn(),
}));

export const useRoute = jest.fn(() => ({
  params: {},
  name: 'MockScreen',
  key: 'mock-key',
}));

export const useFocusEffect = jest.fn();
export const useIsFocused = jest.fn(() => true);

export const NavigationContainer = ({ children }: any) => children;

export const CommonActions = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  reset: jest.fn(),
  setParams: jest.fn(),
};