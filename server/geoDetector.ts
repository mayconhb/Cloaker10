interface GeoResult {
  country: string | null;
  countryName: string | null;
}

const COUNTRY_NAMES: Record<string, string> = {
  BR: "Brasil",
  US: "Estados Unidos",
  PT: "Portugal",
  ES: "Espanha",
  AR: "Argentina",
  MX: "México",
  CO: "Colômbia",
  CL: "Chile",
  PE: "Peru",
  VE: "Venezuela",
  EC: "Equador",
  UY: "Uruguai",
  PY: "Paraguai",
  BO: "Bolívia",
  GB: "Reino Unido",
  DE: "Alemanha",
  FR: "França",
  IT: "Itália",
  CA: "Canadá",
  AU: "Austrália",
  JP: "Japão",
  CN: "China",
  IN: "Índia",
  RU: "Rússia",
  ZA: "África do Sul",
  NG: "Nigéria",
  EG: "Egito",
  AO: "Angola",
  MZ: "Moçambique",
  CV: "Cabo Verde",
  GW: "Guiné-Bissau",
  ST: "São Tomé e Príncipe",
  TL: "Timor-Leste",
};

export function getCountryName(code: string): string {
  return COUNTRY_NAMES[code.toUpperCase()] || code.toUpperCase();
}

export function detectCountryFromHeaders(headers: Record<string, string | string[] | undefined>): GeoResult | null {
  const vercelCountry = headers["x-vercel-ip-country"];
  if (vercelCountry && typeof vercelCountry === "string") {
    return {
      country: vercelCountry.toUpperCase(),
      countryName: getCountryName(vercelCountry),
    };
  }

  const cfCountry = headers["cf-ipcountry"];
  if (cfCountry && typeof cfCountry === "string") {
    return {
      country: cfCountry.toUpperCase(),
      countryName: getCountryName(cfCountry),
    };
  }

  return null;
}

export async function detectCountryFromIP(ip: string, headers?: Record<string, string | string[] | undefined>): Promise<GeoResult> {
  if (headers) {
    const headerResult = detectCountryFromHeaders(headers);
    if (headerResult) {
      return headerResult;
    }
  }

  if (!ip || ip === "127.0.0.1" || ip === "::1" || ip.startsWith("192.168.") || ip.startsWith("10.")) {
    return { country: null, countryName: null };
  }

  try {
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,countryCode,country`, {
      signal: AbortSignal.timeout(3000),
    });

    if (!response.ok) {
      console.error(`Geo API returned status ${response.status}`);
      return { country: null, countryName: null };
    }

    const data = await response.json();

    if (data.status === "success" && data.countryCode) {
      return {
        country: data.countryCode.toUpperCase(),
        countryName: data.country || getCountryName(data.countryCode),
      };
    }

    return { country: null, countryName: null };
  } catch (error) {
    console.error("Error detecting country from IP:", error);
    return { country: null, countryName: null };
  }
}

export function shouldBlockByCountry(
  detectedCountry: string | null,
  blockedCountries: string[] | null
): { shouldBlock: boolean; reason: string | null } {
  if (!blockedCountries || blockedCountries.length === 0) {
    return { shouldBlock: false, reason: null };
  }

  if (!detectedCountry) {
    return { shouldBlock: false, reason: null };
  }

  const normalizedDetected = detectedCountry.toUpperCase();
  const normalizedBlocked = blockedCountries.map(c => c.toUpperCase());

  if (normalizedBlocked.includes(normalizedDetected)) {
    const countryName = getCountryName(normalizedDetected);
    return {
      shouldBlock: true,
      reason: `País bloqueado: ${countryName} (${normalizedDetected})`,
    };
  }

  return { shouldBlock: false, reason: null };
}

export const AVAILABLE_COUNTRIES = [
  { code: "BR", name: "Brasil" },
  { code: "US", name: "Estados Unidos" },
  { code: "PT", name: "Portugal" },
  { code: "ES", name: "Espanha" },
  { code: "AR", name: "Argentina" },
  { code: "MX", name: "México" },
  { code: "CO", name: "Colômbia" },
  { code: "CL", name: "Chile" },
  { code: "PE", name: "Peru" },
  { code: "VE", name: "Venezuela" },
  { code: "EC", name: "Equador" },
  { code: "UY", name: "Uruguai" },
  { code: "PY", name: "Paraguai" },
  { code: "BO", name: "Bolívia" },
  { code: "GB", name: "Reino Unido" },
  { code: "DE", name: "Alemanha" },
  { code: "FR", name: "França" },
  { code: "IT", name: "Itália" },
  { code: "CA", name: "Canadá" },
  { code: "AU", name: "Austrália" },
  { code: "JP", name: "Japão" },
  { code: "CN", name: "China" },
  { code: "IN", name: "Índia" },
  { code: "RU", name: "Rússia" },
  { code: "ZA", name: "África do Sul" },
  { code: "NG", name: "Nigéria" },
  { code: "EG", name: "Egito" },
  { code: "AO", name: "Angola" },
  { code: "MZ", name: "Moçambique" },
  { code: "CV", name: "Cabo Verde" },
  { code: "GW", name: "Guiné-Bissau" },
  { code: "ST", name: "São Tomé e Príncipe" },
  { code: "TL", name: "Timor-Leste" },
];
