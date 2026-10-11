import { BrowserTab } from '../components/BrowserGuide';

export interface DeviceAndBrowserInfo {
  browserId: BrowserTab;
  browserName: string;
  icon: string;
  isAndroid: boolean;
  isMobile: boolean;
  isDesktop: boolean;
  installButtonLabel: string;
  menuIcon: string;
  menuLocation: string;
  menuActionText: string;
  quickInstruction: string;
}

export function detectDeviceAndBrowser(): DeviceAndBrowserInfo {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {
      browserId: 'chrome',
      browserName: 'Google Chrome',
      icon: '🌐',
      isAndroid: true,
      isMobile: true,
      isDesktop: false,
      installButtonLabel: 'Installer dans Google Chrome',
      menuIcon: '⋮',
      menuLocation: 'en haut à droite',
      menuActionText: 'Ajouter à l\'écran d\'accueil',
      quickInstruction: 'Appuyez sur ⋮ en haut à droite puis « Ajouter à l\'écran d\'accueil »',
    };
  }

  const ua = navigator.userAgent || '';
  const isAndroid = /Android/i.test(ua);
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const isDesktop = !isMobile;

  // 1. Samsung Internet
  if (/SamsungBrowser/i.test(ua)) {
    return {
      browserId: 'samsung',
      browserName: 'Samsung Internet',
      icon: '🧭',
      isAndroid: true,
      isMobile: true,
      isDesktop: false,
      installButtonLabel: 'Installer dans Samsung Internet',
      menuIcon: '☰',
      menuLocation: 'en bas à droite',
      menuActionText: 'Ajouter la page à > Écran d\'accueil',
      quickInstruction: 'Appuyez sur ☰ en bas à droite > « Ajouter la page à » > « Écran d\'accueil »',
    };
  }

  // 2. Mozilla Firefox
  if (/Firefox|FxiOS/i.test(ua)) {
    return {
      browserId: 'firefox',
      browserName: 'Mozilla Firefox',
      icon: '🦊',
      isAndroid,
      isMobile,
      isDesktop,
      installButtonLabel: 'Installer dans Firefox',
      menuIcon: '⋮',
      menuLocation: 'à côté de la barre d\'adresse',
      menuActionText: 'Ajouter à l\'écran d\'accueil',
      quickInstruction: 'Appuyez sur ⋮ > « Ajouter à l\'écran d\'accueil »',
    };
  }

  // 3. Microsoft Edge
  if (/EdgA|Edg\//i.test(ua)) {
    return {
      browserId: 'edge',
      browserName: 'Microsoft Edge',
      icon: '🌊',
      isAndroid,
      isMobile,
      isDesktop,
      installButtonLabel: 'Installer dans Edge',
      menuIcon: '⋮',
      menuLocation: 'en bas au centre',
      menuActionText: 'Ajouter à l\'écran d\'accueil',
      quickInstruction: 'Appuyez sur ⋮ en bas > « Ajouter à l\'écran d\'accueil »',
    };
  }

  // 4. Opera / Brave
  if (/OPR|Opera/i.test(ua) || (navigator as any).brave) {
    return {
      browserId: 'opera',
      browserName: (navigator as any).brave ? 'Brave Browser' : 'Opera Mobile',
      icon: '🦁',
      isAndroid,
      isMobile,
      isDesktop,
      installButtonLabel: 'Installer dans Opera / Brave',
      menuIcon: '⋮',
      menuLocation: 'en haut à droite',
      menuActionText: 'Ajouter à l\'écran d\'accueil',
      quickInstruction: 'Appuyez sur ⋮ > « Ajouter à l\'écran d\'accueil »',
    };
  }

  // 5. Default / Google Chrome
  return {
    browserId: 'chrome',
    browserName: 'Google Chrome',
    icon: '🌐',
    isAndroid,
    isMobile,
    isDesktop,
    installButtonLabel: 'Installer dans Google Chrome',
    menuIcon: '⋮',
    menuLocation: 'en haut à droite',
    menuActionText: 'Ajouter à l\'écran d\'accueil ou Installer',
    quickInstruction: 'Appuyez sur ⋮ en haut à droite puis « Ajouter à l\'écran d\'accueil »',
  };
}
