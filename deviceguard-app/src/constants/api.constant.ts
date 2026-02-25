export const API_ENDPOINTS = {
  DEVICES: {
    SYNC: '/api/device-syncs',           // POST — vincula dispositivo con código de activación
    SYNC_STATUS: '/api/device-syncs/status', // GET — consulta estado de vinculación (usado por la web)
  },
} as const;
