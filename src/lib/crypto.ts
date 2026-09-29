import { createPrivateKey, createPublicKey, generateKeyPairSync, createCipheriv, createDecipheriv, randomBytes, createHash } from 'crypto';
import { SignJWT, jwtVerify, importPKCS8, importSPKI, exportSPKI, exportPKCS8 } from 'jose';

const ALGORITHM = 'EdDSA';
const CIPHER = 'aes-256-gcm';

function getMasterKey(): Buffer {
  const key = process.env.MASTER_KEY;
  if (!key) throw new Error('MASTER_KEY environment variable is required');
  return Buffer.from(key, 'hex');
}

/**
 * Generate Ed25519 keypair for an operator
 */
export function generateEd25519KeyPair() {
  const { privateKey, publicKey } = generateKeyPairSync('ed25519');
  
  const publicKeyPem = publicKey.export({ type: 'spki', format: 'pem' }) as string;
  const privateKeyPem = privateKey.export({ type: 'pkcs8', format: 'pem' }) as string;
  
  return { publicKeyPem, privateKeyPem };
}

/**
 * Encrypt a private key with the master key
 */
export function encryptPrivateKey(privateKeyPem: string): string {
  const masterKey = getMasterKey();
  const iv = randomBytes(16);
  const cipher = createCipheriv(CIPHER, masterKey, iv);
  
  let encrypted = cipher.update(privateKeyPem, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypt a private key with the master key
 */
export function decryptPrivateKey(encryptedKey: string): string {
  const masterKey = getMasterKey();
  const [ivHex, authTagHex, encrypted] = encryptedKey.split(':');
  
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = createDecipheriv(CIPHER, masterKey, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

/**
 * Sign a ticket payload as a compact JWS
 */
export async function signTicket(payload: Record<string, unknown>, privateKeyPem: string, kid: string): Promise<string> {
  const privateKey = await importPKCS8(privateKeyPem, ALGORITHM);
  
  const jws = await new SignJWT(payload as any)
    .setProtectedHeader({ alg: ALGORITHM, kid })
    .setIssuedAt()
    .sign(privateKey);
  
  return jws;
}

/**
 * Verify a JWS ticket signature
 */
export async function verifyTicketSignature(jws: string, publicKeyPem: string): Promise<{ valid: boolean; payload?: Record<string, unknown>; error?: string }> {
  try {
    const publicKey = await importSPKI(publicKeyPem, ALGORITHM);
    const { payload } = await jwtVerify(jws, publicKey, {
      algorithms: [ALGORITHM],
    });
    
    return { valid: true, payload: payload as Record<string, unknown> };
  } catch (error: any) {
    return { valid: false, error: error.message };
  }
}

/**
 * Extract the kid from a JWS header without verifying
 */
export function extractKidFromJWS(jws: string): string | null {
  try {
    const [headerB64] = jws.split('.');
    const header = JSON.parse(Buffer.from(headerB64, 'base64url').toString('utf8'));
    return header.kid || null;
  } catch {
    return null;
  }
}

/**
 * Hash passenger information (phone number)
 */
export function hashPassengerInfo(phone: string): string {
  return createHash('sha256').update(`safebus:${phone}`).digest('hex');
}

/**
 * Generate a JWKS response from operator keys
 */
export async function generateJWKS(keys: { kid: string; publicKeyPem: string; operatorId: string }[]) {
  const jwks = await Promise.all(
    keys.map(async (k) => {
      const publicKey = createPublicKey(k.publicKeyPem);
      const jwk = publicKey.export({ format: 'jwk' });
      return {
        ...jwk,
        kid: k.kid,
        use: 'sig',
        alg: 'EdDSA',
        'x-operator-id': k.operatorId,
      };
    })
  );
  
  return { keys: jwks };
}

/**
 * Generate a unique key ID
 */
export function generateKid(operatorPublicId: string): string {
  const timestamp = Date.now().toString(36);
  const random = randomBytes(4).toString('hex');
  return `${operatorPublicId}-${timestamp}-${random}`;
}
