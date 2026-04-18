export const API_ENDPOINTS = {
  DEVICES: {
    SYNC: '/api/device-syncs',           // POST — vincula dispositivo con código de activación
    SYNC_STATUS: '/api/device-syncs/status', // GET — consulta estado de vinculación (usado por la web)
    CHECK_STATUS: (serialNumber: string) => `/api/device-syncs/${serialNumber}`, // GET — estado bloqueado/pago para este serialNumber
  },
  FCM: {
    REGISTER_TOKEN: '/api/device-syncs/fcm-token', // POST — registra token FCM del dispositivo
  },
} as const;


