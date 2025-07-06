export const Audio = {
  setAudioModeAsync: jest.fn(),
  Sound: {
    createAsync: jest.fn().mockResolvedValue({
      playAsync: jest.fn(),
      stopAsync: jest.fn(),
      setIsLoopingAsync: jest.fn(),
      setVolumeAsync: jest.fn(),
      unloadAsync: jest.fn(),
    }),
  },
  INTERRUPTION_MODE_IOS_DO_NOT_MIX: 0,
  INTERRUPTION_MODE_ANDROID_DO_NOT_MIX: 1,
};

export const Video = {
  createAsync: jest.fn(),
};

export default {
  Audio,
  Video,
};