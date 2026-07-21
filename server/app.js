import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cors from 'cors';
import express from 'express';
import env from './config/env.js';
import errorHandler from './middleware/errorHandler.js';
import notFound from './middleware/notFound.js';
import requestLogger from './middleware/requestLogger.js';
import apiRoutes from './routes/index.js';

const app = express();
const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const allowedOrigins = env.clientUrl
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.disable('x-powered-by');

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(null, false);
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

if (env.isDevelopment) {
  app.use(requestLogger);
}

app.use('/uploads', express.static(path.join(currentDirectory, 'uploads')));
app.use('/api', apiRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
