const { device, expect, element, by, waitFor } = require('detox');

beforeAll(async () => {
  await device.launchApp({
    permissions: {
      notifications: 'YES',
      location: 'never',
      camera: 'NO',
      microphone: 'NO',
    },
  });
});

beforeEach(async () => {
  await device.reloadReactNative();
});

afterAll(async () => {
  await device.terminateApp();
});

// Global test helpers
global.sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

global.waitForElementToBeVisible = async (element, timeout = 5000) => {
  await waitFor(element).toBeVisible().withTimeout(timeout);
};

global.waitForElementToBeNotVisible = async (element, timeout = 5000) => {
  await waitFor(element).not.toBeVisible().withTimeout(timeout);
};

global.tapElement = async (element) => {
  await element.tap();
};

global.typeText = async (element, text) => {
  await element.typeText(text);
};

global.scrollToElement = async (scrollView, element) => {
  await scrollView.scrollTo('bottom');
  await waitFor(element).toBeVisible().whileElement(by.id(scrollView)).scroll(200, 'down');
};