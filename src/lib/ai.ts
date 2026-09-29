/**
 * AI integration wrapper with graceful degradation.
 * Uses Anthropic Claude API when ANTHROPIC_API_KEY is set.
 * Falls back to rules-based responses when not configured.
 */

import { z } from 'zod';

const isAIConfigured = () => !!process.env.ANTHROPIC_API_KEY;

interface AIOptions {
  timeout?: number;
  maxRetries?: number;
}

async function callAnthropic(params: {
  system?: string;
  messages: { role: 'user' | 'assistant'; content: string }[];
  maxTokens?: number;
  temperature?: number;
}, options: AIOptions = {}): Promise<string | null> {
  if (!isAIConfigured()) return null;

  const { timeout = 30000, maxRetries = 2 } = options;
  const model = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514';

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeout);

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY!,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model,
          max_tokens: params.maxTokens || 1024,
          temperature: params.temperature ?? 0.3,
          system: params.system,
          messages: params.messages,
        }),
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`Anthropic API error (${response.status}):`, errorBody);
        if (attempt < maxRetries) continue;
        return null;
      }

      const data = await response.json();
      return data.content?.[0]?.text || null;
    } catch (error: any) {
      console.error(`AI call attempt ${attempt + 1} failed:`, error.message);
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
        continue;
      }
      return null;
    }
  }
  return null;
}

/**
 * Explain a verdict in plain language
 */
export async function explainVerdict(params: {
  type: 'ticket' | 'domain';
  verdict: string;
  reasons: { signal: string; description: string }[];
  locale: 'en' | 'ta';
}): Promise<string> {
  const { type, verdict, reasons, locale } = params;
  
  const reasonsList = reasons.map(r => r.description).join('; ');
  
  // Try AI first
  const aiResponse = await callAnthropic({
    system: `You are SafeBus Chennai's fraud explanation assistant. Explain verification results in simple, friendly ${locale === 'ta' ? 'Tamil' : 'English'}. Keep responses under 100 words. Be reassuring for safe results, clear warnings for fraud.`,
    messages: [{
      role: 'user',
      content: `Explain this ${type} verification result to a bus passenger:\nVerdict: ${verdict}\nReasons: ${reasonsList}`,
    }],
    maxTokens: 256,
  });

  if (aiResponse) return aiResponse;

  // Fallback: rules-based explanation
  if (type === 'ticket') {
    switch (verdict) {
      case 'GENUINE': return locale === 'ta' 
        ? '✅ இந்த டிக்கெட் உண்மையானது மற்றும் சரிபார்க்கப்பட்டது. பாதுகாப்பாக பயணிக்கவும்!'
        : '✅ This ticket is genuine and verified. You can travel safely!';
      case 'ALREADY_USED': return locale === 'ta'
        ? '⚠️ இந்த டிக்கெட் ஏற்கனவே பயன்படுத்தப்பட்டது. இது நகல் அல்லது மறுவிற்பனை டிக்கெட்டாக இருக்கலாம்.'
        : '⚠️ This ticket has already been scanned for boarding. It may be a duplicate or resold ticket.';
      case 'INVALID': return locale === 'ta'
        ? '🚫 இந்த டிக்கெட்டின் கையொப்பம் தவறானது. இது போலி டிக்கெட்டாக இருக்கலாம். பயன்படுத்த வேண்டாம்!'
        : '🚫 This ticket\'s digital signature is invalid. It may be counterfeit. Do not use this ticket!';
      case 'REVOKED': return locale === 'ta'
        ? '🚫 இந்த டிக்கெட் ரத்து செய்யப்பட்டது. இது செல்லாது.'
        : '🚫 This ticket has been revoked and is no longer valid.';
      default: return locale === 'ta'
        ? '❓ இந்த டிக்கெட்டை சரிபார்க்க முடியவில்லை.'
        : '❓ Unable to verify this ticket.';
    }
  }

  // Domain verdict
  switch (verdict) {
    case 'ALLOWLISTED': return locale === 'ta'
      ? '✅ இது சரிபார்க்கப்பட்ட, நம்பகமான பேருந்து புக்கிங் தளம்.'
      : '✅ This is a verified, trusted bus booking platform.';
    case 'SAFE': return locale === 'ta'
      ? '✅ இந்த தளம் பாதுகாப்பாகத் தெரிகிறது, ஆனால் எப்போதும் எச்சரிக்கையாக இருங்கள்.'
      : '✅ This website appears safe, but always be cautious.';
    case 'SUSPICIOUS': return locale === 'ta'
      ? `⚠️ இந்த தளம் சந்தேகத்திற்குரியது: ${reasonsList}`
      : `⚠️ This website is suspicious: ${reasonsList}`;
    case 'FRAUD': return locale === 'ta'
      ? `🚫 இந்த தளம் மோசடி என அடையாளம் காணப்பட்டது: ${reasonsList}`
      : `🚫 This website has been identified as fraudulent: ${reasonsList}`;
    default: return reasonsList;
  }
}

/**
 * Triage a user report
 */
export async function triageReport(params: {
  description: string;
  ocrText?: string;
  type: string;
}): Promise<{
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  category: string;
  summary: string;
  extractedEntities: { phones: string[]; upis: string[]; urls: string[]; amounts: number[] };
}> {
  // Extract entities using regex
  const phoneRegex = /(?:\+91|0)?[6-9]\d{9}/g;
  const upiRegex = /[a-zA-Z0-9._-]+@[a-zA-Z0-9]+/g;
  const urlRegex = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/g;
  const amountRegex = /₹?\s?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?|\d+)/g;

  const combinedText = `${params.description || ''} ${params.ocrText || ''}`;
  
  const phones = [...new Set((combinedText.match(phoneRegex) || []))];
  const upis = [...new Set((combinedText.match(upiRegex) || []).filter(u => !u.includes('@gmail') && !u.includes('@yahoo') && !u.includes('@hotmail')))];
  const urls = [...new Set((combinedText.match(urlRegex) || []))];
  const amounts = [...new Set((combinedText.match(amountRegex) || []).map(a => parseFloat(a.replace(/[₹,\s]/g, ''))).filter(a => a > 0 && a < 100000))];

  // Try AI triage
  const aiResponse = await callAnthropic({
    system: 'You are a fraud report triage assistant. Analyze reports and return JSON with severity (LOW/MEDIUM/HIGH/CRITICAL), category, and a brief summary. Focus on identifying the type of scam.',
    messages: [{
      role: 'user',
      content: `Triage this report:\nType: ${params.type}\nDescription: ${params.description}\nOCR Text: ${params.ocrText || 'None'}\n\nReturn JSON: { "severity": "...", "category": "...", "summary": "..." }`,
    }],
    maxTokens: 256,
  });

  if (aiResponse) {
    try {
      const parsed = JSON.parse(aiResponse);
      return {
        severity: parsed.severity || 'MEDIUM',
        category: parsed.category || params.type,
        summary: parsed.summary || 'Report received',
        extractedEntities: { phones, upis, urls, amounts },
      };
    } catch {}
  }

  // Rules-based triage
  let severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'MEDIUM';
  if (amounts.some(a => a > 5000)) severity = 'HIGH';
  if (phones.length > 1 || upis.length > 1) severity = 'HIGH';
  if (amounts.some(a => a > 10000)) severity = 'CRITICAL';

  return {
    severity,
    category: params.type,
    summary: `${params.type} report with ${phones.length} phone(s), ${upis.length} UPI ID(s), ${urls.length} URL(s)`,
    extractedEntities: { phones, upis, urls, amounts },
  };
}

/**
 * Analyze a page for scam signals
 */
export async function analyzePageContent(params: {
  url: string;
  text: string;
  forms?: string[];
  paymentFields?: string[];
}): Promise<{ signals: string[]; score: number }> {
  const aiResponse = await callAnthropic({
    system: 'You are a web page scam classifier. Analyze the page content and identify scam signals. Return JSON: { "signals": ["signal1", "signal2"], "score": 0.0 to 1.0 }',
    messages: [{
      role: 'user',
      content: `Analyze this page:\nURL: ${params.url}\nContent: ${params.text.slice(0, 2000)}\nForms: ${params.forms?.join(', ') || 'None'}\nPayment fields: ${params.paymentFields?.join(', ') || 'None'}`,
    }],
    maxTokens: 512,
  });

  if (aiResponse) {
    try {
      return JSON.parse(aiResponse);
    } catch {}
  }

  // Rules-based analysis
  const signals: string[] = [];
  let score = 0;
  const textLower = params.text.toLowerCase();

  if (textLower.includes('limited time') || textLower.includes('hurry') || textLower.includes('last few seats')) {
    signals.push('urgency_language');
    score += 0.2;
  }
  if (textLower.includes('upi') && textLower.includes('@')) {
    signals.push('personal_upi_detected');
    score += 0.3;
  }
  if (textLower.includes('whatsapp') && textLower.includes('book')) {
    signals.push('whatsapp_booking');
    score += 0.15;
  }
  if (textLower.includes('gpay') || textLower.includes('phonepe') || textLower.includes('paytm')) {
    if (!textLower.includes('merchant')) {
      signals.push('personal_payment_app');
      score += 0.2;
    }
  }

  return { signals, score: Math.min(1, score) };
}

/**
 * Chat assistant (Ask SafeBus)
 */
export async function chatAssistant(params: {
  message: string;
  locale: 'en' | 'ta';
  context?: string;
}): Promise<string> {
  const aiResponse = await callAnthropic({
    system: `You are SafeBus Chennai's assistant. Help passengers with questions about bus ticket scams, verification, and safety in ${params.locale === 'ta' ? 'Tamil' : 'English'}. Never invent facts. If unsure, direct users to verify using the SafeBus app or call 1930.${params.context ? `\n\nContext from registry:\n${params.context}` : ''}`,
    messages: [{ role: 'user', content: params.message }],
    maxTokens: 512,
  });

  if (aiResponse) return aiResponse;

  return params.locale === 'ta'
    ? 'மன்னிக்கவும், இப்போது AI உதவியாளர் கிடைக்கவில்லை. தயவுசெய்து SafeBus ஆப்பில் "சரிபார்" அம்சத்தைப் பயன்படுத்தவும் அல்லது 1930 ஐ அழைக்கவும்.'
    : 'Sorry, the AI assistant is currently unavailable. Please use the "Check" feature in the SafeBus app or call 1930 for immediate help.';
}
