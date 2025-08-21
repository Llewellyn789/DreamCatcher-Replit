
// Feature flags configuration
export const FEATURES = {

  ANALYTICS: import.meta.env.VITE_ENABLE_ANALYTICS !== 'false',
  DREAM_SHARING: import.meta.env.VITE_ENABLE_DREAM_SHARING !== 'false',
} as const;

export type FeatureFlag = keyof typeof FEATURES;

export const isFeatureEnabled = (feature: FeatureFlag): boolean => {
  return FEATURES[feature];
};
