const { AndroidConfig, createRunOncePlugin, withAndroidManifest } = require('@expo/config-plugins');

function isCleartextEnabled() {
  return process.env.EVENTCAPTURE_ANDROID_ALLOW_CLEARTEXT === 'true';
}

const withAndroidCleartextTraffic = (config) =>
  withAndroidManifest(config, (config) => {
    const application = AndroidConfig.Manifest.getMainApplicationOrThrow(config.modResults);
    application.$['android:usesCleartextTraffic'] = isCleartextEnabled() ? 'true' : 'false';
    return config;
  });

module.exports = createRunOncePlugin(
  withAndroidCleartextTraffic,
  'with-android-cleartext-traffic',
  '1.0.0'
);
