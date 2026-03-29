import clientAxios from '../config/axios.config';
import { API_ENDPOINTS } from '../constants/api.constant';

/**
 * Servicio para manejar la comunicación con el backend
 * relacionado a notificaciones push y registro de tokens FCM
 */

export interface RegisterFCMTokenRequest {
  imei: string;
  fcmToken: string;
}

export interface DeviceSync {
  id: string;
  deviceId: string;
  imei: string;
  fcmToken: string | null;
  syncedAt: string;
  lastPing: string;
  device: {
    id: string;
    name: string;
    type: string;
    status: string;
  };
}

export interface RegisterFCMTokenResponse {
  success: boolean;
  message: string;
  deviceSync: DeviceSync;
}

/**
 * Registra el token FCM de un dispositivo en el backend
 */
export async function registerFCMToken(
  data: RegisterFCMTokenRequest
): Promise<RegisterFCMTokenResponse> {
  try {
    const response = await clientAxios.post<RegisterFCMTokenResponse>(
      API_ENDPOINTS.FCM.REGISTER_TOKEN,
      data
    );
    return response.data;
  } catch (error: any) {
    console.error('[NOTIFICATION SERVICE] Error:', error?.response?.data);
    throw error;
  }
}
