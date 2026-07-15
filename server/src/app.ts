import compression from 'compression';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { env } from './config/env.js';
import { ApiError } from './utils/api-error.js';
import { prisma } from './config/prisma.js';
import { errorHandler, notFound } from './middleware/error-handler.js';
import { apiRouter } from './routes/index.js';

export const app = express();

app.disable('x-powered-by');
if (env.NODE_ENV === 'production') app.set('trust proxy', 1);

app.use((request, response, next) => {
  const requestId = request.header('x-request-id')?.trim() || randomUUID();
  response.setHeader('x-request-id', requestId);
  next();
});
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }),
);
app.use(compression());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || env.corsOrigins.includes(origin)) return callback(null, true);
      return callback(new ApiError(403, `Origin ${origin} is not allowed by CORS.`));
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

if (env.UPLOAD_PROVIDER === 'local') {
  app.use(
    '/uploads',
    express.static(path.resolve(process.cwd(), env.UPLOAD_DIR), {
      maxAge: env.NODE_ENV === 'production' ? '7d' : 0,
      immutable: env.NODE_ENV === 'production',
    }),
  );
}

app.get('/health', (_request, response) => {
  response.status(200).json({
    success: true,
    service: 'member-services-server',
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

app.get('/ready', async (_request, response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return response.status(200).json({ success: true, database: 'ready' });
  } catch {
    return response.status(503).json({ success: false, database: 'unavailable' });
  }
});

const apiLimiter = rateLimit({
  windowMs: env.API_RATE_LIMIT_WINDOW_MS,
  limit: env.API_RATE_LIMIT_MAX,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again shortly.' },
});

app.use('/api', apiLimiter, apiRouter);
app.use(notFound);
app.use(errorHandler);
