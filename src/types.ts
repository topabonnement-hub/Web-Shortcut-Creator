export type GenerationMethodId = 'standard' | 'chrome' | 'pwa' | 'intent';

export interface IconSource {
  src: string;
  label: string;
  size: string;
  source: string;
}

export interface WebsiteAnalysis {
  url: string;
  domain: string;
  fullDomain: string;
  protocol: string;
  title: string;
  rawTitle: string;
  siteName: string;
  description: string;
  themeColor: string;
  hasManifest: boolean;
  manifestUrl?: string;
  icons: IconSource[];
  defaultIcon: string;
  crawlStatus: 'success' | 'fallback';
}

export type AndroidIconShape = 'circle' | 'squircle' | 'rounded-square' | 'teardrop';

export interface CustomShortcutConfig {
  id?: string;
  url: string;
  title: string;
  iconUrl: string;
  iconShape: AndroidIconShape;
  themeColor: string;
  openMode: 'browser' | 'standalone';
  customMonogram: {
    text: string;
    bgColor: string;
    textColor: string;
    gradientEnd: string;
  };
  method: GenerationMethodId;
}

export interface MethodDetails {
  id: GenerationMethodId;
  title: string;
  subtitle: string;
  badge: string;
  description: string;
  features: string[];
  technicalLimits: string;
  isRecommended?: boolean;
}
