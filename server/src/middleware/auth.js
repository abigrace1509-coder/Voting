import TokenBlocklist from '../models/TokenBlocklist.js';
import { decodeToken } from '../utils/jwt.js';

export const auth = (role) => async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ message: 'Missing token' });

    const blocked = await TokenBlocklist.findOne({ token });
    if (blocked) return res.status(401).json({ message: 'Token expired' });

    const payload = decodeToken(token);
    if (role && payload.role !== role) return res.status(403).json({ message: 'Forbidden' });
    req.user = payload;
    req.token = token;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }
};
