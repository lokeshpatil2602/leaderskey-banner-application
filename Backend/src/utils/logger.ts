import winston from 'winston';
import morgan from 'morgan';
import type { StreamOptions } from 'morgan';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [new winston.transports.Console()],
});

export const morganStream: StreamOptions = {
  write: (message) => logger.info(message.trim()),
};

export { logger };
