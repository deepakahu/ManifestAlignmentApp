// Mock for AsyncStorage
export default {
  getItem: jest.fn((key: string) => Promise.resolve(null)),
  setItem: jest.fn((key: string, value: string) => Promise.resolve()),
  removeItem: jest.fn((key: string) => Promise.resolve()),
  getAllKeys: jest.fn(() => Promise.resolve([])),
  multiGet: jest.fn((keys: string[]) => Promise.resolve(keys.map(key => [key, null]))),
  multiSet: jest.fn((keyValuePairs: [string, string][]) => Promise.resolve()),
  multiRemove: jest.fn((keys: string[]) => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
};