const { AndroidConfig, createRunOncePlugin, withAndroidManifest } = require('@expo/config-plugins');

const withAndroidCleartextTraffic = (config) =>
  withAndroidManifest(config, (config) => {
    const application = AndroidConfig.Manifest.getMainApplicationOrThrow(config.modResults);
    application.$['android:usesCleartextTraffic'] = 'true';
    return config;
  });

module.exports = createRunOncePlugin(
  withAndroidCleartextTraffic,
  'with-android-cleartext-traffic',
  '1.0.0'
);
