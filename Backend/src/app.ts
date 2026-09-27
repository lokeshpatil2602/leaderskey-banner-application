import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { logger, morganStream } from './utils/logger';
import promClient from 'prom-client';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from './docs/swagger.json';
import { generalRateLimiter, authRateLimiter } from './middleware/rateLimiter.middleware';
import { getDatabaseStatus } from './config/database';
import { env, getAllowedOrigins } from './config/environment';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import authRoutes from './routes/auth.routes';
import bannerRoutes from './routes/banner.routes';
import categoryRoutes from './routes/category.routes';
import healthRoutes from './routes/health.routes';
import templateRoutes from './routes/template.routes';
import userRoutes from './routes/users.routes';
import { sendSuccess } from './utils/apiResponse';
import organizationListRoutes from './routes/organization.list.routes';
import uploadRoutes from './routes/upload.routes';


const app = express();
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"] ,
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:"],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: []
      }
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true
    }
  })
);
app.use(generalRateLimiter);
const allowedOrigins = getAllowedOrigins();
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        callback(null, true);
        return;
      }
      callback(new Error(`Origin ${origin} is not allowed by CORS`));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/', (_req, res) => {
  sendSuccess(res, 'Banner Application backend is running', {
    environment: env.NODE_ENV
  });
});

app.get('/health', async (_req, res) => {
  const database = getDatabaseStatus();
  sendSuccess(res, 'Backend is healthy', {
    server: 'running',
    api: 'healthy',
    environment: env.NODE_ENV,
    database,
    timestamp: new Date().toISOString()
  });
});

// HTTP request logging
app.use(morgan('combined', { stream: morganStream }));

// Swagger UI documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Metrics collection
promClient.collectDefaultMetrics();

// Prometheus metrics endpoint
app.get('/metrics', async (_req, res) => {
  res.set('Content-Type', promClient.register.contentType);
  res.end(await promClient.register.metrics());
});

app.use('/api/auth', authRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/users', userRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/organizations', organizationListRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
