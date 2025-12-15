// Bot Detection
const BOT_SIGNATURES = [
  { pattern: /headless/i, reason: "Headless Browser" },
  { pattern: /puppeteer/i, reason: "Puppeteer" },
  { pattern: /playwright/i, reason: "Playwright" },
  { pattern: /selenium/i, reason: "Selenium" },
  { pattern: /webdriver/i, reason: "WebDriver" },
  { pattern: /phantomjs/i, reason: "PhantomJS" },
  { pattern: /nightmare/i, reason: "Nightmare.js" },
  { pattern: /python-requests/i, reason: "Python Requests" },
  { pattern: /python-urllib/i, reason: "Python urllib" },
  { pattern: /python/i, reason: "Python Script" },
  { pattern: /java\//i, reason: "Java HTTP Client" },
  { pattern: /node-fetch/i, reason: "Node Fetch" },
  { pattern: /axios/i, reason: "Axios" },
  { pattern: /got\//i, reason: "Got HTTP Client" },
  { pattern: /node\.js/i, reason: "Node.js" },
  { pattern: /go-http-client/i, reason: "Go HTTP Client" },
  { pattern: /ruby/i, reason: "Ruby Script" },
  { pattern: /perl/i, reason: "Perl Script" },
  { pattern: /php\//i, reason: "PHP Script" },
  { pattern: /curl/i, reason: "cURL" },
  { pattern: /wget/i, reason: "wget" },
  { pattern: /httpie/i, reason: "HTTPie" },
  { pattern: /lynx/i, reason: "Lynx" },
  { pattern: /libwww/i, reason: "libwww" },
  { pattern: /ahrefs/i, reason: "Ahrefs Bot" },
  { pattern: /semrush/i, reason: "Semrush Bot" },
  { pattern: /moz\s*bot/i, reason: "Moz Bot" },
  { pattern: /majestic/i, reason: "Majestic Bot" },
  { pattern: /screaming\s*frog/i, reason: "Screaming Frog" },
  { pattern: /sistrix/i, reason: "Sistrix Bot" },
  { pattern: /dotbot/i, reason: "DotBot" },
  { pattern: /rogerbot/i, reason: "RogerBot" },
  { pattern: /bot(?!\s*\d)/i, reason: "Generic Bot" },
  { pattern: /crawler/i, reason: "Crawler" },
  { pattern: /spider/i, reason: "Spider" },
  { pattern: /scraper/i, reason: "Scraper" },
  { pattern: /slurp/i, reason: "Yahoo Slurp" },
  { pattern: /archive\.org/i, reason: "Archive.org Bot" },
  { pattern: /ia_archiver/i, reason: "Alexa Crawler" },
  { pattern: /adplexity/i, reason: "AdPlexity" },
  { pattern: /bigspy/i, reason: "BigSpy" },
  { pattern: /poweradspy/i, reason: "PowerAdSpy" },
  { pattern: /dropispy/i, reason: "Dropispy" },
  { pattern: /anstrex/i, reason: "Anstrex" },
  { pattern: /adspy/i, reason: "AdSpy Tool" },
  { pattern: /spyfu/i, reason: "SpyFu" },
  { pattern: /facebookexternalhit/i, reason: "Facebook External Hit" },
  { pattern: /facebot/i, reason: "Facebook Bot" },
  { pattern: /httrack/i, reason: "HTTrack" },
  { pattern: /nutch/i, reason: "Apache Nutch" },
  { pattern: /scrapy/i, reason: "Scrapy" },
  { pattern: /mechanize/i, reason: "Mechanize" },
  { pattern: /cfnetwork/i, reason: "CFNetwork Bot" },
  { pattern: /apache-httpclient/i, reason: "Apache HTTP Client" },
  { pattern: /okhttp/i, reason: "OkHttp" },
  { pattern: /restsharp/i, reason: "RestSharp" },
];

const SUSPICIOUS_PATTERNS = [
  { pattern: /^$/i, reason: "Empty User-Agent" },
  { pattern: /^mozilla\/5\.0$/i, reason: "Minimal Mozilla UA" },
  { pattern: /^mozilla\/4\.0$/i, reason: "Outdated Mozilla UA" },
];

export interface BotDetectionResult {
  isBot: boolean;
  reason: string | null;
  confidence: "high" | "medium" | "low";
}

export function detectBot(userAgent: string | undefined | null): BotDetectionResult {
  if (!userAgent || userAgent.trim() === "") {
    return { isBot: true, reason: "Missing User-Agent", confidence: "high" };
  }

  for (const signature of BOT_SIGNATURES) {
    if (signature.pattern.test(userAgent)) {
      return { isBot: true, reason: signature.reason, confidence: "high" };
    }
  }

  for (const suspicious of SUSPICIOUS_PATTERNS) {
    if (suspicious.pattern.test(userAgent)) {
      return { isBot: true, reason: suspicious.reason, confidence: "medium" };
    }
  }

  if (userAgent.length < 20) {
    return { isBot: true, reason: "Suspiciously Short User-Agent", confidence: "medium" };
  }

  const hasBrowserIndicator = /chrome|firefox|safari|edge|opera|msie|trident/i.test(userAgent);
  const hasMobileIndicator = /mobile|android|iphone|ipad|ipod/i.test(userAgent);
  
  if (!hasBrowserIndicator && !hasMobileIndicator) {
    return { isBot: true, reason: "No Browser Signature", confidence: "medium" };
  }

  return { isBot: false, reason: null, confidence: "low" };
}

// Device Detection
type DeviceType = "mobile" | "desktop" | "tablet" | "unknown";

const MOBILE_PATTERNS = [
  /android.*mobile/i, /iphone/i, /ipod/i, /blackberry/i, /windows phone/i,
  /opera mini/i, /opera mobi/i, /iemobile/i, /mobile safari/i, /webos/i,
];

const TABLET_PATTERNS = [
  /ipad/i, /android(?!.*mobile)/i, /tablet/i, /kindle/i, /silk/i, /playbook/i,
];

const DESKTOP_PATTERNS = [
  /windows nt/i, /macintosh/i, /mac os x/i, /linux(?!.*android)/i, /cros/i, /x11/i,
];

const IN_APP_BROWSER_PATTERNS = [
  /FBAN/i, /FBAV/i, /FB_IAB/i, /FBIOS/i, /Instagram/i, /Messenger/i,
  /WhatsApp/i, /TikTok/i, /Twitter/i, /LinkedInApp/i, /Snapchat/i,
];

export interface DeviceDetectionResult {
  deviceType: DeviceType;
  isMobile: boolean;
  isDesktop: boolean;
  isTablet: boolean;
  reason: string;
}

export function detectDevice(userAgent: string | undefined | null): DeviceDetectionResult {
  if (!userAgent || userAgent.trim() === "") {
    return { deviceType: "unknown", isMobile: false, isDesktop: false, isTablet: false, reason: "Missing User-Agent" };
  }

  for (const pattern of IN_APP_BROWSER_PATTERNS) {
    if (pattern.test(userAgent)) {
      return { deviceType: "mobile", isMobile: true, isDesktop: false, isTablet: false, reason: "In-App Browser" };
    }
  }

  for (const pattern of TABLET_PATTERNS) {
    if (pattern.test(userAgent)) {
      return { deviceType: "tablet", isMobile: false, isDesktop: false, isTablet: true, reason: "Tablet" };
    }
  }

  for (const pattern of MOBILE_PATTERNS) {
    if (pattern.test(userAgent)) {
      return { deviceType: "mobile", isMobile: true, isDesktop: false, isTablet: false, reason: "Mobile" };
    }
  }

  for (const pattern of DESKTOP_PATTERNS) {
    if (pattern.test(userAgent)) {
      return { deviceType: "desktop", isMobile: false, isDesktop: true, isTablet: false, reason: "Desktop" };
    }
  }

  return { deviceType: "unknown", isMobile: false, isDesktop: false, isTablet: false, reason: "Unknown" };
}

export function shouldBlockDevice(detection: DeviceDetectionResult, blockDesktop: boolean): { shouldBlock: boolean; reason: string | null } {
  if (blockDesktop && detection.isDesktop) {
    return { shouldBlock: true, reason: "Desktop bloqueado" };
  }
  return { shouldBlock: false, reason: null };
}

// Geo Detection
const COUNTRY_NAMES: Record<string, string> = {
  BR: "Brasil", US: "Estados Unidos", PT: "Portugal", ES: "Espanha",
  AR: "Argentina", MX: "México", CO: "Colômbia", CL: "Chile",
};

export function getCountryName(code: string): string {
  return COUNTRY_NAMES[code.toUpperCase()] || code.toUpperCase();
}

export interface GeoResult {
  country: string | null;
  countryName: string | null;
}

export function detectCountryFromHeaders(headers: Record<string, string | undefined>): GeoResult {
  const vercelCountry = headers["x-vercel-ip-country"];
  if (vercelCountry) {
    return { country: vercelCountry.toUpperCase(), countryName: getCountryName(vercelCountry) };
  }

  const cfCountry = headers["cf-ipcountry"];
  if (cfCountry) {
    return { country: cfCountry.toUpperCase(), countryName: getCountryName(cfCountry) };
  }

  return { country: null, countryName: null };
}

export function shouldBlockByCountry(detectedCountry: string | null, blockedCountries: string[] | null): { shouldBlock: boolean; reason: string | null } {
  if (!blockedCountries || blockedCountries.length === 0 || !detectedCountry) {
    return { shouldBlock: false, reason: null };
  }

  const normalizedDetected = detectedCountry.toUpperCase();
  const normalizedBlocked = blockedCountries.map(c => c.toUpperCase());

  if (normalizedBlocked.includes(normalizedDetected)) {
    return { shouldBlock: true, reason: `País bloqueado: ${getCountryName(normalizedDetected)}` };
  }

  return { shouldBlock: false, reason: null };
}

// Origin Lock
const META_IN_APP_PATTERNS = [
  { pattern: /FBAN/i, name: "Facebook App" },
  { pattern: /FBAV/i, name: "Facebook App" },
  { pattern: /FB_IAB/i, name: "Facebook In-App Browser" },
  { pattern: /FBIOS/i, name: "Facebook iOS" },
  { pattern: /Instagram/i, name: "Instagram App" },
  { pattern: /Messenger/i, name: "Messenger App" },
  { pattern: /WhatsApp/i, name: "WhatsApp" },
];

export interface OriginLockResult {
  isLegitimate: boolean;
  hasFbclid: boolean;
  isInAppBrowser: boolean;
  inAppBrowserName: string | null;
  reason: string;
}

function checkFbclid(url: string): boolean {
  return url.includes('fbclid=');
}

function checkInAppBrowser(userAgent: string | undefined | null): { isInApp: boolean; browserName: string | null } {
  if (!userAgent) return { isInApp: false, browserName: null };

  for (const pattern of META_IN_APP_PATTERNS) {
    if (pattern.pattern.test(userAgent)) {
      return { isInApp: true, browserName: pattern.name };
    }
  }
  return { isInApp: false, browserName: null };
}

export function detectOriginLock(fullUrl: string, userAgent: string | undefined | null): OriginLockResult {
  const hasFbclid = checkFbclid(fullUrl);
  const inAppCheck = checkInAppBrowser(userAgent);

  if (hasFbclid) {
    return { isLegitimate: true, hasFbclid: true, isInAppBrowser: inAppCheck.isInApp, inAppBrowserName: inAppCheck.browserName, reason: "fbclid detectado" };
  }

  if (inAppCheck.isInApp) {
    return { isLegitimate: true, hasFbclid: false, isInAppBrowser: true, inAppBrowserName: inAppCheck.browserName, reason: `Navegador interno (${inAppCheck.browserName})` };
  }

  return { isLegitimate: false, hasFbclid: false, isInAppBrowser: false, inAppBrowserName: null, reason: "Acesso direto sem rastro de anúncio" };
}

export function shouldBlockByOrigin(originResult: OriginLockResult, enableOriginLock: boolean): { shouldBlock: boolean; reason: string | null } {
  if (!enableOriginLock) return { shouldBlock: false, reason: null };

  if (!originResult.isLegitimate) {
    return { shouldBlock: true, reason: originResult.reason };
  }

  return { shouldBlock: false, reason: null };
}

// Helper to get client IP
export function getClientIP(req: any): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    return (typeof forwarded === "string" ? forwarded : forwarded[0]).split(",")[0].trim();
  }
  const realIp = req.headers["x-real-ip"];
  if (realIp) {
    return typeof realIp === "string" ? realIp : realIp[0];
  }
  return req.socket?.remoteAddress || "unknown";
}

export const AVAILABLE_COUNTRIES = [
  { code: "BR", name: "Brasil" }, { code: "US", name: "Estados Unidos" },
  { code: "PT", name: "Portugal" }, { code: "ES", name: "Espanha" },
  { code: "AR", name: "Argentina" }, { code: "MX", name: "México" },
  { code: "CO", name: "Colômbia" }, { code: "CL", name: "Chile" },
  { code: "PE", name: "Peru" }, { code: "VE", name: "Venezuela" },
];
