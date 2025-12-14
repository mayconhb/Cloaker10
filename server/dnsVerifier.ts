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

const EXPECTED_TARGETS = [
  process.env.REPLIT_DEV_DOMAIN || "",
  process.env.REPL_SLUG ? `${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co` : "",
].filter(Boolean);

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
    reason: "DNS verification failed. Please ensure your CNAME or TXT record is configured correctly.",
  };
}

async function verifyCname(domain: string): Promise<DnsVerificationResult> {
  try {
    const records = await resolveCname(domain);
    
    for (const record of records) {
      const normalizedRecord = record.toLowerCase();
      for (const target of EXPECTED_TARGETS) {
        if (normalizedRecord.includes(target.toLowerCase()) || 
            normalizedRecord.endsWith('.replit.dev') ||
            normalizedRecord.endsWith('.repl.co') ||
            normalizedRecord.endsWith('.replit.app')) {
          return {
            verified: true,
            method: "cname",
            reason: "CNAME record verified successfully",
            targetFound: record,
          };
        }
      }
    }
    
    return {
      verified: false,
      method: "cname",
      reason: `CNAME found but points to wrong target: ${records.join(", ")}`,
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
  const replitDomain = process.env.REPLIT_DEV_DOMAIN || 
    `${process.env.REPL_SLUG || 'app'}.${process.env.REPL_OWNER || 'user'}.repl.co`;
  
  return {
    cnameInstructions: {
      host: entryDomain,
      target: replitDomain,
    },
    txtInstructions: {
      host: `_linkshield.${entryDomain}`,
      value: `linkshield-verify=${verificationToken}`,
    },
  };
}
