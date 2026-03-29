export interface ProvisioningCode {
  value: string[];
  isComplete: boolean;
}

export interface ProvisioningResponse {
  success: boolean;
  deviceId: string;
  message: string;
}
