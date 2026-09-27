import mongoose from 'mongoose';
import { env } from '../environment';

export type DatabaseStatus = {
  connected: boolean;
  uriConfigured: boolean;
  state: string;
};

export const getDatabaseStatus = (): DatabaseStatus => {
  const state = mongoose.connection.readyState;

  return {
    connected: state === 1,
    uriConfigured: Boolean(env.MONGODB_URI),
    state: {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    }[state as 0 | 1 | 2 | 3] ?? 'unknown'
  };
};

export const connectDatabase = async (): Promise<void> => {
  if (!env.MONGODB_URI) {
    if (env.NODE_ENV === 'production') {
      throw new Error('MONGODB_URI environment variable is required in production.');
    }
    console.warn('MONGODB_URI is not set. Database connection skipped for this environment.');
    return;
  }

  try {
    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      authSource: 'admin'
    });

    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection failed:', error instanceof Error ? error.message : error);
    throw error;
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  if (mongoose.connection.readyState === 0) {
    return;
  }

  await mongoose.disconnect();
  console.log('MongoDB disconnected successfully');
};
