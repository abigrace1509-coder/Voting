import crypto from 'crypto';

export const hashBiometric = (rawValue) => {
  const pepper = process.env.BIOMETRIC_PEPPER || 'pepper';
  return crypto.createHash('sha256').update(`${pepper}:${rawValue}`).digest('hex');
};
