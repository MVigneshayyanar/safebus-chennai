/**
 * Risk scoring engine for domains, URLs, and entities.
 * Weighted, explainable score 0-100 with reasons list.
 * Thresholds: 0-29 SAFE, 30-59 SUSPICIOUS, 60+ FRAUD
 */

export interface RiskSignal {
  signal: string;
  weight: number;
  description: string;
  category: string;
}

export interface RiskResult {
  score: number;
  verdict: 'SAFE' | 'SUSPICIOUS' | 'FRAUD' | 'ALLOWLISTED';
  reasons: RiskSignal[];
  lookalikeOf?: string;
}

// Known legitimate bus booking platforms
export const ALLOWLIST = [
  'redbus.in',
  'www.redbus.in',
  'abhibus.com',
  'www.abhibus.com',
  'tnstc.in',
  'www.tnstc.in',
  'setcbus.com',
  'www.setcbus.com',
  'kpntravels.com',
  'www.kpntravels.com',
  'srstravels.com',
  'www.srstravels.com',
  'parveen.in',
  'www.parveen.in',
  'kallada.in',
  'www.kallada.in',
  'svrtravels.com',
  'www.svrtravels.com',
  'greenbus.in',
  'www.greenbus.in',
  'intrcity.in',
  'www.intrcity.in',
  'yatra.com',
  'www.yatra.com',
  'makemytrip.com',
  'www.makemytrip.com',
  'goibibo.com',
  'www.goibibo.com',
  'paytm.com',
  'www.paytm.com',
];

// Levenshtein distance
function levenshtein(a: string, b: string): number {
  const matrix = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      matrix[i][j] = a[i - 1] === b[j - 1]
        ? matrix[i - 1][j - 1]
        : 1 + Math.min(matrix[i - 1][j], matrix[i][j - 1], matrix[i - 1][j - 1]);
    }
  }
  return matrix[a.length][b.length];
}

// Homoglyph map for lookalike detection
const HOMOGLYPHS: Record<string, string[]> = {
  'a': ['а', 'ɑ', '@'],
  'b': ['Ь', 'ƅ'],
  'c': ['с', 'ϲ', 'ᴄ'],
  'd': ['ԁ', 'ɗ'],
  'e': ['е', 'ё', 'ε'],
  'g': ['ɡ', 'ġ'],
  'h': ['һ', 'ʜ'],
  'i': ['і', 'ı', '1', 'l', '|'],
  'k': ['κ', 'ⲕ'],
  'l': ['1', 'ⅼ', '|', 'i'],
  'n': ['ո', 'ṇ'],
  'o': ['о', '0', 'ο', 'ᴏ'],
  'p': ['р', 'ρ'],
  'r': ['г', 'ɾ'],
  's': ['ѕ', 'ꜱ'],
  't': ['τ', 'ţ'],
  'u': ['υ', 'ս'],
  'v': ['ν', 'ⅴ'],
  'w': ['ω', 'ⲱ'],
  'x': ['х', 'ⅹ'],
  'y': ['у', 'ý'],
  'z': ['ᴢ', 'ẑ'],
};

// Check if domain is a homoglyph of an allowlisted brand
function checkHomoglyph(domain: string): string | null {
  const domainBase = domain.replace(/\.(com|in|org|net|co\.in|io|app|xyz|online|site|info|biz|top|tk|ml|ga|cf|gq)$/i, '');
  
  for (const allowed of ALLOWLIST) {
    const allowedBase = allowed.replace(/^www\./, '').replace(/\.(com|in|org|net|co\.in|io)$/i, '');
    
    // Direct Levenshtein
    const dist = levenshtein(domainBase, allowedBase);
    if (dist > 0 && dist <= 2) {
      return allowed;
    }
    
    // Check for character substitutions
    if (domainBase.length === allowedBase.length) {
      let substitutions = 0;
      for (let i = 0; i < domainBase.length; i++) {
        if (domainBase[i] !== allowedBase[i]) {
          const glyphs = HOMOGLYPHS[allowedBase[i]];
          if (glyphs && glyphs.includes(domainBase[i])) {
            substitutions++;
          }
        }
      }
      if (substitutions > 0 && substitutions <= 2) {
        return allowed;
      }
    }
  }
  return null;
}

// Suspicious TLDs
const SUSPICIOUS_TLDS = ['.xyz', '.top', '.tk', '.ml', '.ga', '.cf', '.gq', '.buzz', '.click', '.link', '.site', '.online', '.space', '.fun', '.icu', '.club'];

// Bus-related keywords for domain analysis
const BUS_KEYWORDS = [
  'bus', 'ticket', 'book', 'travel', 'omni', 'sleeper', 'chennai', 'madurai', 
  'kcbt', 'kilambakkam', 'tambaram', 'express', 'reservation', 'transit', 'seat',
  'fastbus', 'coimbatore', 'bangalore', 'salem', 'trichy', 'koyambedu'
];

export function scoreDomain(params: {
  host: string;
  whoisAgeDays?: number | null;
  tlsIssuer?: string | null;
  tlsAgeDays?: number | null;
  hostingIp?: string | null;
  pageContent?: string;
  paymentFields?: { personalUpi?: boolean; merchantId?: string };
  sharedEntities?: { phones?: string[]; upis?: string[]; domains?: string[] };
  aiSignal?: number;
}): RiskResult {
  const { host } = params;
  const reasons: RiskSignal[] = [];
  let totalScore = 0;

  // Check allowlist
  const normalizedHost = host.toLowerCase().replace(/^www\./, '').trim();
  if (ALLOWLIST.some(a => a.replace(/^www\./, '') === normalizedHost)) {
    return { 
      score: 0, 
      verdict: 'ALLOWLISTED', 
      reasons: [{ 
        signal: 'allowlisted', 
        weight: 0, 
        description: 'Verified legitimate platform in the official Tamil Nadu omnibus registry', 
        category: 'trust' 
      }] 
    };
  }

  // Not in allowlist - it is UNVERIFIED / UNTRUSTED by default
  // 1. Unregistered entity baseline penalty (weight: 35)
  reasons.push({
    signal: 'unverified_registry',
    weight: 35,
    description: 'Domain is NOT registered with the Tamil Nadu State Transport Authority (STA) or recognized omnibus aggregators',
    category: 'registry',
  });
  totalScore += 35;

  // 2. Bus / ticketing keywords in unregistered domain (weight: 35)
  // An unregistered domain claiming to sell omnibus tickets is a prime phishing / scalping indicator!
  const matchedKeywords = BUS_KEYWORDS.filter(k => normalizedHost.includes(k));
  if (matchedKeywords.length > 0) {
    const kwWeight = Math.min(45, 30 + (matchedKeywords.length - 1) * 5);
    reasons.push({
      signal: 'unregistered_ticket_portal',
      weight: kwWeight,
      description: `Domain contains bus reservation keywords ("${matchedKeywords.join('", "')}") without official STA licensing`,
      category: 'impersonation',
    });
    totalScore += kwWeight;
  }

  // 3. Example / dynamic / test / suspicious subdomain patterns (weight: 20)
  if (
    normalizedHost.endsWith('.example.com') ||
    normalizedHost.includes('example.') ||
    normalizedHost.includes('test') ||
    normalizedHost.includes('temp') ||
    normalizedHost.includes('demo') ||
    normalizedHost.split('.').length > 3
  ) {
    reasons.push({
      signal: 'untrusted_host',
      weight: 20,
      description: 'Uses an unverified third-party host, dynamic subdomain, or non-production hostname',
      category: 'domain',
    });
    totalScore += 20;
  }

  // 4. Domain age (weight: 25)
  if (params.whoisAgeDays !== undefined && params.whoisAgeDays !== null) {
    if (params.whoisAgeDays < 30) {
      const signal: RiskSignal = { signal: 'new_domain', weight: 25, description: `Domain is only ${params.whoisAgeDays} days old – very recently created`, category: 'domain' };
      reasons.push(signal);
      totalScore += 25;
    } else if (params.whoisAgeDays < 90) {
      const signal: RiskSignal = { signal: 'young_domain', weight: 15, description: `Domain is only ${params.whoisAgeDays} days old`, category: 'domain' };
      reasons.push(signal);
      totalScore += 15;
    } else if (params.whoisAgeDays < 180) {
      const signal: RiskSignal = { signal: 'moderately_new_domain', weight: 8, description: `Domain is ${params.whoisAgeDays} days old`, category: 'domain' };
      reasons.push(signal);
      totalScore += 8;
    }
  }

  // 5. TLS certificate (weight: 15)
  if (params.tlsIssuer) {
    const freeIssuers = ["let's encrypt", 'zerossl', 'buypass', 'ssl.com free'];
    if (freeIssuers.some(f => params.tlsIssuer!.toLowerCase().includes(f))) {
      if (params.tlsAgeDays !== undefined && params.tlsAgeDays !== null && params.tlsAgeDays < 30) {
        const signal: RiskSignal = { signal: 'free_new_tls', weight: 15, description: `Free TLS certificate from ${params.tlsIssuer}, issued ${params.tlsAgeDays} days ago`, category: 'certificate' };
        reasons.push(signal);
        totalScore += 15;
      }
    }
  }

  // 6. Suspicious TLD (weight: 10)
  const tld = '.' + host.split('.').slice(-1)[0].toLowerCase();
  if (SUSPICIOUS_TLDS.includes(tld)) {
    const signal: RiskSignal = { signal: 'suspicious_tld', weight: 10, description: `Uses suspicious top-level domain "${tld}"`, category: 'domain' };
    reasons.push(signal);
    totalScore += 10;
  }

  // 7. Lookalike / typosquat (weight: 20)
  const lookalikeOf = checkHomoglyph(normalizedHost);
  if (lookalikeOf) {
    const signal: RiskSignal = { signal: 'lookalike', weight: 20, description: `Domain imitates "${lookalikeOf}" – likely a typosquat or impersonation`, category: 'impersonation' };
    reasons.push(signal);
    totalScore += 20;
  }

  // 8. Personal UPI payment (weight: 15)
  if (params.paymentFields?.personalUpi) {
    const signal: RiskSignal = { signal: 'personal_upi', weight: 15, description: 'Accepts payment to a personal UPI ID instead of a registered merchant', category: 'payment' };
    reasons.push(signal);
    totalScore += 15;
  }

  // 9. Shared entities with known fraud (weight: 20)
  const sharedCount = (params.sharedEntities?.phones?.length || 0) + (params.sharedEntities?.upis?.length || 0) + (params.sharedEntities?.domains?.length || 0);
  if (sharedCount > 0) {
    const signal: RiskSignal = { signal: 'shared_fraud_entities', weight: Math.min(20, sharedCount * 7), description: `Shares ${sharedCount} identifier(s) (phone/UPI/domain) with known fraud reports`, category: 'network' };
    reasons.push(signal);
    totalScore += signal.weight;
  }

  // 10. AI signal (weight: up to 10, optional)
  if (params.aiSignal !== undefined && params.aiSignal > 0) {
    const aiWeight = Math.min(10, Math.round(params.aiSignal * 10));
    const signal: RiskSignal = { signal: 'ai_classifier', weight: aiWeight, description: 'AI analysis flagged suspicious content patterns on this page', category: 'ai' };
    reasons.push(signal);
    totalScore += aiWeight;
  }

  // Clamp
  totalScore = Math.min(100, Math.max(0, totalScore));

  // Determine verdict
  let verdict: RiskResult['verdict'];
  if (totalScore >= 60) verdict = 'FRAUD';
  else if (totalScore >= 30) verdict = 'SUSPICIOUS';
  else verdict = 'SAFE';

  return { score: totalScore, verdict, reasons, lookalikeOf: lookalikeOf || undefined };
}

/**
 * Fare cap check: returns true if fare exceeds the cap
 */
export function isFareAboveCap(fare: number, baseFare: number, fareCapMultiplier: number): boolean {
  return fare > baseFare * fareCapMultiplier;
}

/**
 * Scalping anomaly detection (z-score style)
 */
export function detectBulkBuy(purchases: { buyerHash: string; count: number; timeWindowMinutes: number }[]): { anomalies: typeof purchases; threshold: number } {
  if (purchases.length === 0) return { anomalies: [], threshold: 0 };
  
  const counts = purchases.map(p => p.count);
  const mean = counts.reduce((a, b) => a + b, 0) / counts.length;
  const stdDev = Math.sqrt(counts.reduce((sum, c) => sum + Math.pow(c - mean, 2), 0) / counts.length);
  const threshold = mean + 2 * (stdDev || 1);
  
  const anomalies = purchases.filter(p => p.count > threshold);
  return { anomalies, threshold };
}

export function detectPriceGouge(tickets: { fare: number; baseFare: number; fareCapMultiplier: number }[]): { gouged: typeof tickets } {
  const gouged = tickets.filter(t => isFareAboveCap(t.fare, t.baseFare, t.fareCapMultiplier));
  return { gouged };
}
