import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import Admin from './models/Admin.js';

dotenv.config();
await connectDB();

const username = process.env.SEED_ADMIN_USERNAME || 'admin';
const password = process.env.SEED_ADMIN_PASSWORD || 'admin@123';
const passwordHash = await bcrypt.hash(password, 10);

await Admin.updateOne({ username }, { username, passwordHash }, { upsert: true });
console.log('Seed complete:', username);
process.exit(0);
