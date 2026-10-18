const { withPodfileProperties } = require('@expo/config-plugins');

module.exports = function withUseThirdPartySQLitePod(expoConfig) {
  return withPodfileProperties(expoConfig, (config) => {
    config.modResults = {
      ...config.modResults,
      'expo.updates.useThirdPartySQLitePod': 'true',
    };
    return config;
  });
};
