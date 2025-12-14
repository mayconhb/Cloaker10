// Camada 1: Anti-Automação (Blacklist de Bots)
// Detecta e bloqueia ferramentas de automação, scrapers e bots

const BOT_SIGNATURES = [
  // Headless browsers and automation tools
  { pattern: /headless/i, reason: "Headless Browser" },
  { pattern: /puppeteer/i, reason: "Puppeteer" },
  { pattern: /playwright/i, reason: "Playwright" },
  { pattern: /selenium/i, reason: "Selenium" },
  { pattern: /webdriver/i, reason: "WebDriver" },
  { pattern: /phantomjs/i, reason: "PhantomJS" },
  { pattern: /nightmare/i, reason: "Nightmare.js" },
  
  // Programming languages and scripts
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
  
  // CLI tools
  { pattern: /curl/i, reason: "cURL" },
  { pattern: /wget/i, reason: "wget" },
  { pattern: /httpie/i, reason: "HTTPie" },
  { pattern: /lynx/i, reason: "Lynx" },
  { pattern: /libwww/i, reason: "libwww" },
  
  // SEO and spy tools
  { pattern: /ahrefs/i, reason: "Ahrefs Bot" },
  { pattern: /semrush/i, reason: "Semrush Bot" },
  { pattern: /moz\s*bot/i, reason: "Moz Bot" },
  { pattern: /majestic/i, reason: "Majestic Bot" },
  { pattern: /screaming\s*frog/i, reason: "Screaming Frog" },
  { pattern: /sistrix/i, reason: "Sistrix Bot" },
  { pattern: /dotbot/i, reason: "DotBot" },
  { pattern: /rogerbot/i, reason: "RogerBot" },
  
  // Generic bots and crawlers
  { pattern: /bot(?!\s*\d)/i, reason: "Generic Bot" },
  { pattern: /crawler/i, reason: "Crawler" },
  { pattern: /spider/i, reason: "Spider" },
  { pattern: /scraper/i, reason: "Scraper" },
  { pattern: /slurp/i, reason: "Yahoo Slurp" },
  { pattern: /archive\.org/i, reason: "Archive.org Bot" },
  { pattern: /ia_archiver/i, reason: "Alexa Crawler" },
  
  // Spy tools and ad library scrapers
  { pattern: /adplexity/i, reason: "AdPlexity" },
  { pattern: /bigspy/i, reason: "BigSpy" },
  { pattern: /poweradspy/i, reason: "PowerAdSpy" },
  { pattern: /dropispy/i, reason: "Dropispy" },
  { pattern: /anstrex/i, reason: "Anstrex" },
  { pattern: /adspy/i, reason: "AdSpy Tool" },
  { pattern: /spyfu/i, reason: "SpyFu" },
  
  // Facebook Ad Library and compliance
  { pattern: /facebookexternalhit/i, reason: "Facebook External Hit" },
  { pattern: /facebot/i, reason: "Facebook Bot" },
  
  // Other automation indicators
  { pattern: /httrack/i, reason: "HTTrack" },
  { pattern: /nutch/i, reason: "Apache Nutch" },
  { pattern: /scrapy/i, reason: "Scrapy" },
  { pattern: /mechanize/i, reason: "Mechanize" },
  { pattern: /cfnetwork/i, reason: "CFNetwork Bot" },
  { pattern: /apache-httpclient/i, reason: "Apache HTTP Client" },
  { pattern: /okhttp/i, reason: "OkHttp" },
  { pattern: /restsharp/i, reason: "RestSharp" },
];

// Suspicious patterns that indicate automation
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
  // No User-Agent is highly suspicious
  if (!userAgent || userAgent.trim() === "") {
    return {
      isBot: true,
      reason: "Missing User-Agent",
      confidence: "high",
    };
  }

  const ua = userAgent.toLowerCase();

  // Check against bot signatures
  for (const signature of BOT_SIGNATURES) {
    if (signature.pattern.test(userAgent)) {
      return {
        isBot: true,
        reason: signature.reason,
        confidence: "high",
      };
    }
  }

  // Check suspicious patterns
  for (const suspicious of SUSPICIOUS_PATTERNS) {
    if (suspicious.pattern.test(userAgent)) {
      return {
        isBot: true,
        reason: suspicious.reason,
        confidence: "medium",
      };
    }
  }

  // Additional heuristics
  
  // Very short User-Agent (less than 20 chars) is suspicious
  if (userAgent.length < 20) {
    return {
      isBot: true,
      reason: "Suspiciously Short User-Agent",
      confidence: "medium",
    };
  }

  // User-Agent without common browser indicators
  const hasBrowserIndicator = /chrome|firefox|safari|edge|opera|msie|trident/i.test(userAgent);
  const hasMobileIndicator = /mobile|android|iphone|ipad|ipod/i.test(userAgent);
  
  if (!hasBrowserIndicator && !hasMobileIndicator) {
    return {
      isBot: true,
      reason: "No Browser Signature",
      confidence: "medium",
    };
  }

  // Passed all checks - appears to be a real user
  return {
    isBot: false,
    reason: null,
    confidence: "low",
  };
}

// Helper to get client IP from request
export function getClientIP(req: any): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    return (typeof forwarded === "string" ? forwarded : forwarded[0]).split(",")[0].trim();
  }
  return req.socket?.remoteAddress || req.ip || "unknown";
}
