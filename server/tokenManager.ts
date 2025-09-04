
import crypto from 'crypto';

// In-memory revocation list - in production, use Redis or database
const revokedTokens = new Set<string>();

const SECRET_KEY = process.env.TOKEN_SECRET || 'dreamcatcher-secret-key-change-in-production';

interface TokenPayload {
  i: string;           // dream ID
  archetype: string;   // main archetype
  snippet: string;     // short excerpt (max 100 chars)
  guidance: string;    // brief guidance (max 150 chars)
  palette?: string;    // color palette for OG image
  exp: number;         // expiry timestamp
}

export function createShareToken(payload: TokenPayload): string {
  // Ensure snippet and guidance are truncated
  const sanitizedPayload = {
    ...payload,
    snippet: payload.snippet.substring(0, 100),
    guidance: payload.guidance.substring(0, 150),
    exp: payload.exp || Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days default
  };

  const payloadString = JSON.stringify(sanitizedPayload);
  const payloadBase64 = Buffer.from(payloadString).toString('base64url');
  
  const signature = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(payloadBase64)
    .digest('base64url');
  
  return `${payloadBase64}.${signature}`;
}

export function verifyShareToken(token: string): { valid: boolean; payload?: TokenPayload; error?: string } {
  try {
    const [payloadBase64, signature] = token.split('.');
    
    if (!payloadBase64 || !signature) {
      return { valid: false, error: 'Invalid token format' };
    }

    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', SECRET_KEY)
      .update(payloadBase64)
      .digest('base64url');
    
    if (signature !== expectedSignature) {
      return { valid: false, error: 'Invalid signature' };
    }

    // Decode payload
    const payloadString = Buffer.from(payloadBase64, 'base64url').toString();
    const payload: TokenPayload = JSON.parse(payloadString);

    // Check expiry
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return { valid: false, error: 'Token expired' };
    }

    // Check revocation
    if (revokedTokens.has(payload.i)) {
      return { valid: false, error: 'Token revoked' };
    }

    return { valid: true, payload };
  } catch (error) {
    return { valid: false, error: 'Token parsing error' };
  }
}

export function revokeToken(dreamId: string): void {
  revokedTokens.add(dreamId);
}

export function isTokenRevoked(dreamId: string): boolean {
  return revokedTokens.has(dreamId);
}
