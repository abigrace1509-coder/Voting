import jwt from 'jsonwebtoken';

export const createToken = (payload) => jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });

export const decodeToken = (token) => jwt.verify(token, process.env.JWT_SECRET);
