import { apiRequest } from '../client';

export type HealthCheckResponse = {
  success: boolean;
  message: string;
  timestamp: string;
  environment: string;
  data?: {
    server: string;
    api: string;
    environment: string;
    database: {
      connected: boolean;
      uriConfigured: boolean;
      state: string;
    };
  };
};

export const getHealthStatus = async (): Promise<HealthCheckResponse> => {
  return apiRequest<HealthCheckResponse>('/health');
};
