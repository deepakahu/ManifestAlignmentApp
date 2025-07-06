// Mock for expo-linking
export const openURL = jest.fn().mockResolvedValue(undefined);
export const canOpenURL = jest.fn().mockResolvedValue(true);
export const getInitialURL = jest.fn().mockResolvedValue(null);
export const addEventListener = jest.fn();
export const removeEventListener = jest.fn();
export const parse = jest.fn();
export const createURL = jest.fn();

export default {
  openURL,
  canOpenURL,
  getInitialURL,
  addEventListener,
  removeEventListener,
  parse,
  createURL,
};