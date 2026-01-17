const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withAndroid16KBSupport(config) {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults;
    const mainApplication = androidManifest.manifest.application[0];

    // Add 16KB page size support property
    if (!mainApplication.property) {
      mainApplication.property = [];
    }

    // Add the 16KB page size property
    mainApplication.property.push({
      $: {
        'android:name': 'android.app.16kb_page_size',
        'android:value': 'true',
      },
    });

    return config;
  });
};
