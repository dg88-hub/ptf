import { createMiddleware } from '@mswjs/http-middleware';
import cors from 'cors';
import express from 'express';
import { handlers } from './handlers';

const app = express();
const port = 9000; // Mock server port

// Enable CORS
app.use(cors());

// Add MSW middleware
app.use(createMiddleware(...handlers));

// Fallback for unhandled requests
app.use((req, res) => {
  res.status(404).json({ error: 'Mock not found' });
});

let server: any;

export function startMockServer() {
  return new Promise<void>((resolve) => {
    server = app.listen(port, () => {
      console.log(`[MockServer] Listening on http://localhost:${port}`);
      resolve();
    });
  });
}

export function stopMockServer() {
  if (server) {
    server.close(() => {
      console.log('[MockServer] Stopped');
    });
  }
}

// Allow running directly if file is executed
if (require.main === module) {
  startMockServer();
}
