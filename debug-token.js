
import crypto from 'crypto';

const SECRET_KEY = process.env.TOKEN_SECRET || 'dreamcatcher-secret-key-change-in-production';

function verifyShareToken(token) {
  try {
    const [payloadBase64, signature] = token.split('.');
    
    if (!payloadBase64 || !signature) {
      return { valid: false, error: 'Invalid token format - missing parts' };
    }

    console.log('Token parts:', { payloadBase64: payloadBase64.substring(0, 50), signature: signature.substring(0, 20) });

    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', SECRET_KEY)
      .update(payloadBase64)
      .digest('base64url');
    
    console.log('Expected signature:', expectedSignature.substring(0, 20));
    console.log('Actual signature:', signature.substring(0, 20));
    
    if (signature !== expectedSignature) {
      return { valid: false, error: 'Invalid signature' };
    }

    // Decode payload
    const payloadString = Buffer.from(payloadBase64, 'base64url').toString();
    const payload = JSON.parse(payloadString);

    console.log('Decoded payload:', payload);

    // Check expiry
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return { valid: false, error: 'Token expired' };
    }

    return { valid: true, payload };
  } catch (error) {
    console.error('Token parsing error:', error);
    return { valid: false, error: 'Token parsing error: ' + error.message };
  }
}

function createTestToken() {
  const payload = {
    i: "debug-dream-id",
    archetype: "The Explorer", 
    snippet: "This is an extremely long dream snippet that should definitely exceed the 80 character limit for testing text clamping functionality properly",
    guidance: "Debug guidance message for testing",
    exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
  };

  const payloadString = JSON.stringify(payload);
  const payloadBase64 = Buffer.from(payloadString).toString('base64url');
  
  const signature = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(payloadBase64)
    .digest('base64url');
  
  return `${payloadBase64}.${signature}`;
}

// Handle command line arguments
const command = process.argv[2];
const tokenArg = process.argv[3];

if (command === 'create') {
  const token = createTestToken();
  console.log('Created test token:', token);
  console.log('Test it with: node debug-token.js verify', token);
} else if (command === 'verify' && tokenArg) {
  console.log('Testing token:', tokenArg);
  const result = verifyShareToken(tokenArg);
  console.log('Result:', result);
} else if (process.argv[2] && !process.argv[3]) {
  // Backwards compatibility - treat single arg as token to verify
  console.log('Testing token:', process.argv[2]);
  const result = verifyShareToken(process.argv[2]);
  console.log('Result:', result);
} else {
  console.log('Usage:');
  console.log('  node debug-token.js create                    # Create a test token');
  console.log('  node debug-token.js verify <token>           # Verify a token');
  console.log('  node debug-token.js <token>                  # Verify a token (legacy)');
}
