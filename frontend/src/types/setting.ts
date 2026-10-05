export interface SystemSetting {
  id: number;
  key: string;
  value: string;
  description?: string;
  updated_at: string;
}

export interface ThresholdUpdatePayload {
  threshold: number;
}
