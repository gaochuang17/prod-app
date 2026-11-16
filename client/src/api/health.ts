import { apiClient } from "./client";

export interface HealthResponse {
  status: string;
  uptimeSeconds: number;
  timestamp: string;
}

export async function fetchHealth(): Promise<HealthResponse> {
  const res = await apiClient.get<HealthResponse>("/health");
  return res.data;
}
