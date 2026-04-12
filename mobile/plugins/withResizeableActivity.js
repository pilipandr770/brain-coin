const { withAndroidManifest } = require('@expo/config-plugins');

/**
 * Sets android:resizeableActivity="true" on the main Activity.
 * Required for Android 16+ large screen / foldable support.
 */
const withResizeableActivity = (config) => {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults;
    const application = manifest.manifest.application?.[0];
    if (!application) return config;

    const activities = application.activity ?? [];
    const mainActivity = activities.find((a) =>
      (a.$?.['android:name'] ?? '').includes('MainActivity')
    );

    if (mainActivity) {
      mainActivity.$['android:resizeableActivity'] = 'true';
    }

    return config;
  });
};

module.exports = withResizeableActivity;
