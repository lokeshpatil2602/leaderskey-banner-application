import 'dotenv/config';
import app from './app';
import { connectDatabase, disconnectDatabase } from './config/database';
import { env, validateEnvironment } from './config/environment';

const startServer = async (): Promise<void> => {
  try {
    validateEnvironment();
    await connectDatabase();

    const server = app.listen(env.PORT, env.HOST, () => {
      console.log(`Backend running on ${env.HOST}:${env.PORT}`);
    });

    const shutdown = async (): Promise<void> => {
      server.close(async () => {
        await disconnectDatabase();
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (error) {
    console.error('Unable to start server:', error instanceof Error ? error.message : error);
    await disconnectDatabase();
    process.exit(1);
  }
};

startServer();
