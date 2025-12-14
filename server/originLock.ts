// Camada 4: Trava de Origem Híbrida (Origin Lock)
// Verifica se o clique tem "rastros" de ser legítimo de um anúncio do Facebook/Instagram
// Regra: Exige que a URL tenha o parâmetro fbclid OU que o navegador seja o interno do app (Instagram, Facebook App, Messenger)

// Padrões de User-Agent que identificam navegadores internos do Facebook/Instagram/Messenger
const IN_APP_BROWSER_PATTERNS = [
  // Facebook App Browser
  { pattern: /FBAN/i, name: "Facebook App (Android)" },
  { pattern: /FBAV/i, name: "Facebook App Version" },
  { pattern: /FB_IAB/i, name: "Facebook In-App Browser" },
  { pattern: /FBIOS/i, name: "Facebook iOS" },
  { pattern: /FBSN/i, name: "Facebook Browser" },
  { pattern: /FBBV/i, name: "Facebook Build Version" },
  { pattern: /FBSS/i, name: "Facebook Browser SS" },
  
  // Instagram App Browser
  { pattern: /Instagram/i, name: "Instagram App" },
  
  // Messenger App Browser
  { pattern: /Messenger/i, name: "Messenger App" },
  { pattern: /FBMD/i, name: "Messenger Device" },
  
  // WhatsApp (também pertence à Meta)
  { pattern: /WhatsApp/i, name: "WhatsApp" },
];

export interface OriginLockResult {
  isLegitimate: boolean;
  hasFbclid: boolean;
  isInAppBrowser: boolean;
  inAppBrowserName: string | null;
  reason: string;
}

/**
 * Verifica se a URL contém o parâmetro fbclid
 * O Facebook adiciona automaticamente este parâmetro em todos os cliques de anúncios
 */
function checkFbclid(url: string): boolean {
  try {
    // Verifica tanto na query string quanto no fragmento
    const hasInQuery = url.includes('fbclid=');
    const hasInFragment = url.includes('#') && url.split('#')[1]?.includes('fbclid=');
    return hasInQuery || hasInFragment;
  } catch {
    return false;
  }
}

/**
 * Verifica se o User-Agent indica um navegador interno de apps da Meta
 * (Facebook, Instagram, Messenger, WhatsApp)
 */
function checkInAppBrowser(userAgent: string | undefined | null): { isInApp: boolean; browserName: string | null } {
  if (!userAgent) {
    return { isInApp: false, browserName: null };
  }

  for (const pattern of IN_APP_BROWSER_PATTERNS) {
    if (pattern.pattern.test(userAgent)) {
      return { isInApp: true, browserName: pattern.name };
    }
  }

  return { isInApp: false, browserName: null };
}

/**
 * Detecta se o acesso é legítimo baseado na lógica híbrida:
 * - Verificação A: Tem fbclid na URL? -> LIBERA
 * - Verificação B: Está usando In-App Browser da Meta? -> LIBERA
 * - Se nenhuma das duas: BLOQUEIA
 * 
 * @param fullUrl - URL completa da requisição (incluindo query string)
 * @param userAgent - User-Agent do navegador
 * @returns OriginLockResult com o resultado da verificação
 */
export function detectOriginLock(
  fullUrl: string,
  userAgent: string | undefined | null
): OriginLockResult {
  const hasFbclid = checkFbclid(fullUrl);
  const inAppCheck = checkInAppBrowser(userAgent);

  // Lógica Híbrida: LIBERA se tiver fbclid OU se for In-App Browser
  if (hasFbclid) {
    return {
      isLegitimate: true,
      hasFbclid: true,
      isInAppBrowser: inAppCheck.isInApp,
      inAppBrowserName: inAppCheck.browserName,
      reason: "Clique legítimo: fbclid detectado",
    };
  }

  if (inAppCheck.isInApp) {
    return {
      isLegitimate: true,
      hasFbclid: false,
      isInAppBrowser: true,
      inAppBrowserName: inAppCheck.browserName,
      reason: `Clique legítimo: Navegador interno (${inAppCheck.browserName})`,
    };
  }

  // Se não tem fbclid E não está no In-App Browser -> BLOQUEIA
  return {
    isLegitimate: false,
    hasFbclid: false,
    isInAppBrowser: false,
    inAppBrowserName: null,
    reason: "Acesso direto sem rastro de anúncio (sem fbclid, fora do In-App Browser)",
  };
}

/**
 * Verifica se o acesso deve ser bloqueado pela Camada 4
 * @param originResult - Resultado da detecção de origem
 * @param enableOriginLock - Se a campanha tem Origin Lock habilitado
 * @returns Objeto indicando se deve bloquear e o motivo
 */
export function shouldBlockByOrigin(
  originResult: OriginLockResult,
  enableOriginLock: boolean
): { shouldBlock: boolean; reason: string | null } {
  if (!enableOriginLock) {
    return { shouldBlock: false, reason: null };
  }

  if (!originResult.isLegitimate) {
    return {
      shouldBlock: true,
      reason: originResult.reason,
    };
  }

  return { shouldBlock: false, reason: null };
}
