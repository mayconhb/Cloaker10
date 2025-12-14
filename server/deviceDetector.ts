// Camada 2: Filtro de Dispositivo (Device Check)
// Detecta se o acesso é de Desktop ou Mobile e bloqueia conforme configuração

export type DeviceType = "desktop" | "mobile" | "tablet" | "unknown";

export interface DeviceDetectionResult {
  deviceType: DeviceType;
  isMobile: boolean;
  isDesktop: boolean;
  isTablet: boolean;
  reason: string;
}

// Mobile device patterns
const MOBILE_PATTERNS = [
  /android.*mobile/i,
  /iphone/i,
  /ipod/i,
  /blackberry/i,
  /windows phone/i,
  /opera mini/i,
  /opera mobi/i,
  /iemobile/i,
  /mobile safari/i,
  /webos/i,
  /fennec/i,
  /netfront/i,
  /symbian/i,
  /samsung.*mobile/i,
  /lg.*mobile/i,
  /htc.*mobile/i,
  /mot.*mobile/i,
  /nokia/i,
  /palm/i,
  /kindle/i,
  /silk.*mobile/i,
  /blazer/i,
  /bolt/i,
  /doris/i,
  /gobrowser/i,
  /iris/i,
  /maemo/i,
  /minimo/i,
  /mmp/i,
  /obigo/i,
  /pocket/i,
  /polaris/i,
  /psp/i,
  /semc-browser/i,
  /skyfire/i,
  /teashark/i,
  /teleca/i,
  /ucweb/i,
  /up\.browser/i,
  /up\.link/i,
  /vodafone/i,
  /wap1\./i,
  /wap2\./i,
];

// Tablet patterns (tablets are treated as mobile by default but can be identified)
const TABLET_PATTERNS = [
  /ipad/i,
  /android(?!.*mobile)/i,
  /tablet/i,
  /kindle/i,
  /silk/i,
  /playbook/i,
  /nexus 7/i,
  /nexus 9/i,
  /nexus 10/i,
  /galaxy tab/i,
  /sm-t\d+/i, // Samsung tablets
  /gt-p\d+/i, // Samsung tablets older
];

// Desktop browser patterns
const DESKTOP_PATTERNS = [
  /windows nt/i,
  /macintosh/i,
  /mac os x/i,
  /linux(?!.*android)/i,
  /cros/i, // Chrome OS
  /x11/i,
];

// In-App Browser patterns (Facebook, Instagram, etc.) - these are always mobile
const IN_APP_BROWSER_PATTERNS = [
  /FBAN/i,  // Facebook App Android
  /FBAV/i,  // Facebook App Version
  /Instagram/i,
  /FB_IAB/i, // Facebook In-App Browser
  /Messenger/i,
  /FBIOS/i, // Facebook iOS
  /Line\//i,
  /Twitter/i,
  /LinkedInApp/i,
  /Snapchat/i,
  /Pinterest/i,
  /TikTok/i,
  /WhatsApp/i,
];

export function detectDevice(userAgent: string | undefined | null): DeviceDetectionResult {
  if (!userAgent || userAgent.trim() === "") {
    return {
      deviceType: "unknown",
      isMobile: false,
      isDesktop: false,
      isTablet: false,
      reason: "Missing User-Agent",
    };
  }

  const ua = userAgent;

  // First check for In-App Browsers (always considered mobile)
  for (const pattern of IN_APP_BROWSER_PATTERNS) {
    if (pattern.test(ua)) {
      return {
        deviceType: "mobile",
        isMobile: true,
        isDesktop: false,
        isTablet: false,
        reason: "In-App Browser (Social Media App)",
      };
    }
  }

  // Check for tablets first (before mobile, as some tablets match mobile patterns)
  for (const pattern of TABLET_PATTERNS) {
    if (pattern.test(ua)) {
      return {
        deviceType: "tablet",
        isMobile: true, // Tablets are treated as mobile for blocking purposes
        isDesktop: false,
        isTablet: true,
        reason: "Tablet Device",
      };
    }
  }

  // Check for mobile devices
  for (const pattern of MOBILE_PATTERNS) {
    if (pattern.test(ua)) {
      return {
        deviceType: "mobile",
        isMobile: true,
        isDesktop: false,
        isTablet: false,
        reason: "Mobile Device",
      };
    }
  }

  // Check for generic "Mobile" keyword (catches many mobile browsers)
  if (/mobile/i.test(ua)) {
    return {
      deviceType: "mobile",
      isMobile: true,
      isDesktop: false,
      isTablet: false,
      reason: "Mobile Browser",
    };
  }

  // Check for desktop patterns
  for (const pattern of DESKTOP_PATTERNS) {
    if (pattern.test(ua)) {
      return {
        deviceType: "desktop",
        isMobile: false,
        isDesktop: true,
        isTablet: false,
        reason: "Desktop Browser",
      };
    }
  }

  // Default to desktop if no patterns match (most bots are desktop-based)
  return {
    deviceType: "desktop",
    isMobile: false,
    isDesktop: true,
    isTablet: false,
    reason: "Unknown (Defaulting to Desktop)",
  };
}

// Check if device should be blocked based on campaign settings
export function shouldBlockDevice(
  deviceResult: DeviceDetectionResult,
  blockDesktop: boolean
): { shouldBlock: boolean; reason: string | null } {
  if (blockDesktop && deviceResult.isDesktop) {
    return {
      shouldBlock: true,
      reason: `Desktop Blocked: ${deviceResult.reason}`,
    };
  }

  return {
    shouldBlock: false,
    reason: null,
  };
}
