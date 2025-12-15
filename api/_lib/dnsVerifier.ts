import dns from "dns";
import { promisify } from "util";

const resolveCname = promisify(dns.resolveCname);
const resolveTxt = promisify(dns.resolveTxt);
const resolve4 = promisify(dns.resolve4);

export interface DnsVerificationResult {
  verified: boolean;
  method: "cname" | "txt" | "a_record" | null;
  reason: string;
  targetFound?: string;
}

const VERCEL_CNAME = "cname.vercel-dns.com";
const VERCEL_IP = "76.76.21.21";

export async function verifyDomainDns(
  entryDomain: string,
  verificationToken?: string
): Promise<DnsVerificationResult> {
  const cleanDomain = entryDomain.toLowerCase().replace(/^www\./, '');
  
  try {
    const cnameResult = await verifyCname(cleanDomain);
    if (cnameResult.verified) {
      return cnameResult;
    }
  } catch (error) {
  }

  try {
    const aRecordResult = await verifyARecord(cleanDomain);
    if (aRecordResult.verified) {
      return aRecordResult;
    }
  } catch (error) {
  }

  if (verificationToken) {
    try {
      const txtResult = await verifyTxtRecord(cleanDomain, verificationToken);
      if (txtResult.verified) {
        return txtResult;
      }
    } catch (error) {
    }
  }

  return {
    verified: false,
    method: null,
    reason: "DNS verification failed. Please ensure your CNAME or A record is configured correctly pointing to Vercel.",
  };
}

async function verifyCname(domain: string): Promise<DnsVerificationResult> {
  try {
    const records = await resolveCname(domain);
    
    for (const record of records) {
      const normalizedRecord = record.toLowerCase();
      if (normalizedRecord.includes(VERCEL_CNAME) || 
          normalizedRecord.includes('vercel') ||
          normalizedRecord.endsWith('.vercel.app') ||
          normalizedRecord.endsWith('.vercel-dns.com')) {
        return {
          verified: true,
          method: "cname",
          reason: "CNAME record verified successfully",
          targetFound: record,
        };
      }
    }
    
    return {
      verified: false,
      method: "cname",
      reason: `CNAME found but points to wrong target: ${records.join(", ")}. Expected: ${VERCEL_CNAME}`,
    };
  } catch (error: any) {
    if (error.code === "ENODATA" || error.code === "ENOTFOUND") {
      return {
        verified: false,
        method: "cname",
        reason: "No CNAME record found for this domain",
      };
    }
    throw error;
  }
}

async function verifyARecord(domain: string): Promise<DnsVerificationResult> {
  try {
    const records = await resolve4(domain);
    
    if (records.includes(VERCEL_IP)) {
      return {
        verified: true,
        method: "a_record",
        reason: "A record verified successfully",
        targetFound: VERCEL_IP,
      };
    }
    
    return {
      verified: false,
      method: "a_record",
      reason: `A record found but points to wrong IP: ${records.join(", ")}. Expected: ${VERCEL_IP}`,
    };
  } catch (error: any) {
    if (error.code === "ENODATA" || error.code === "ENOTFOUND") {
      return {
        verified: false,
        method: "a_record",
        reason: "No A record found for this domain",
      };
    }
    throw error;
  }
}

async function verifyTxtRecord(
  domain: string,
  verificationToken: string
): Promise<DnsVerificationResult> {
  try {
    const records = await resolveTxt(`_linkshield.${domain}`);
    const flatRecords = records.map(r => r.join(""));
    
    const expectedValue = `linkshield-verify=${verificationToken}`;
    
    if (flatRecords.some(r => r === expectedValue)) {
      return {
        verified: true,
        method: "txt",
        reason: "TXT record verified successfully",
        targetFound: expectedValue,
      };
    }
    
    return {
      verified: false,
      method: "txt",
      reason: "TXT record found but value doesn't match",
    };
  } catch (error: any) {
    if (error.code === "ENODATA" || error.code === "ENOTFOUND") {
      return {
        verified: false,
        method: "txt",
        reason: "No TXT record found",
      };
    }
    throw error;
  }
}

export function getDnsInstructions(entryDomain: string, verificationToken: string): {
  cnameInstructions: { host: string; target: string };
  txtInstructions: { host: string; value: string };
} {
  return {
    cnameInstructions: {
      host: entryDomain,
      target: VERCEL_CNAME,
    },
    txtInstructions: {
      host: `_linkshield.${entryDomain}`,
      value: `linkshield-verify=${verificationToken}`,
    },
  };
}
