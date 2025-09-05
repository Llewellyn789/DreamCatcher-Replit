
const crypto = require('crypto');

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

// Test with the token from your screenshot
const testToken = process.argv[2];
if (testToken) {
  console.log('Testing token:', testToken);
  const result = verifyShareToken(testToken);
  console.log('Result:', result);
} else {
  console.log('Usage: node debug-token.js <token>');
}
