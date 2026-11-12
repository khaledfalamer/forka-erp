// Start: node src/server.js  (Cloud Run gives PORT). Needs DATABASE_URL; GOOGLE_CLIENT_ID optional.
import { buildApp } from './app.js';
const app = buildApp();
await app.listen({ port: Number(process.env.PORT || 8080), host: '0.0.0.0' });
