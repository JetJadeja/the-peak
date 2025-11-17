export const PORT = process.env.PORT || 3000;

// CORS Configuration - support multiple origins
const allowedOrigins: string[] = [
  'http://localhost:5173',
  'https://the-peak-client-zeta.vercel.app',
];

// Add custom client URL if provided
if (process.env.CLIENT_URL && !allowedOrigins.includes(process.env.CLIENT_URL)) {
  allowedOrigins.push(process.env.CLIENT_URL);
}

export const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
export const ALLOWED_ORIGINS = allowedOrigins;

// Validation Constants
export const MIN_USERNAME_LENGTH = 1;
export const MAX_USERNAME_LENGTH = 20; // Matches client UI limit
