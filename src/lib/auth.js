import jwt from 'jsonwebtoken';

/**
 * Generate JWT token for Ghost Admin API authentication
 * @param {string} apiKey - Ghost admin API key (format: id:secret)
 * @param {string} adminDomain - Ghost admin domain
 * @returns {string} JWT token
 */
export function generateToken(apiKey, adminDomain) {
  const [id, secret] = apiKey.split(':');

  if (!id || !secret) {
    throw new Error('Invalid API key format. Expected: id:secret');
  }

  const payload = {
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 300, // 5 minutes
    aud: '/admin/',
    kid: id
  };

  // Decode secret from hex to binary
  const decodedSecret = Buffer.from(secret, 'hex');

  return jwt.sign(payload, decodedSecret, { algorithm: 'HS256', keyid: id });
}

/**
 * Get authorization header value
 * @param {string} apiKey - Ghost admin API key
 * @returns {string} Authorization header value
 */
export function getAuthHeader(apiKey) {
  const token = generateToken(apiKey, '');
  return `Ghost ${token}`;
}
