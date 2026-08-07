import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  port: Number(process.env.PORT) || 4000,
  env: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 3316,
    user: process.env.DB_USER || 'payroll',
    password: process.env.DB_PASSWORD || 'payroll123',
    database: process.env.DB_NAME || 'payroll',
    connectionLimit: Number(process.env.DB_CONNECTION_LIMIT) || 10,
  },
  auth: {
    mode: process.env.AUTH_MODE || 'mock', // 'mock' | 'api'
    pmisBaseUrl: process.env.PMIS_BASE_URL || '',
    applicationKey: process.env.PMIS_APPLICATION_KEY || '',
  },
};
