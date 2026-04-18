import { useEffect, useState } from 'react';
import * as Application from 'expo-application';
import * as Device from 'expo-device';
import { Platform, NativeModules } from 'react-native';

const { DeviceModule } = NativeModules;

export interface DeviceIdentity {
  serialNumber: string | null;
  deviceModel: string | null;
  isReady: boolean;
}

export function useDeviceImei(): DeviceIdentity {
  const [identity, setIdentity] = useState<DeviceIdentity>({
    serialNumber: null,
    deviceModel: null,
    isReady: false,
  });

  useEffect(() => {
    async function resolveDeviceIdentity() {
      try {
        let serialNumber: string | null = null;

        if (Platform.OS === 'android') {
          if (DeviceModule && DeviceModule.getDeviceImei) {
            try {
              serialNumber = await DeviceModule.getDeviceImei();
              if (serialNumber && serialNumber.length >= 8) {
                console.log('[DEVICE] Serial Number obtenido:', serialNumber);
              } else {
                console.warn('[DEVICE] Serial Number inválido:', serialNumber);
                serialNumber = null;
              }
            } catch (err) {
              console.error('[DEVICE] Error obteniendo Serial Number:', err);
            }
          }

          if (!serialNumber) {
            serialNumber = Application.getAndroidId();
            console.warn('[DEVICE] Usando androidId como fallback:', serialNumber);
          }
        } else if (Platform.OS === 'ios') {
          serialNumber = await Application.getIosIdForVendorAsync();
        }

        if (!serialNumber) {
          serialNumber = `${Device.modelName ?? 'unknown'}-${Date.now()}`;
        }

        const deviceModel =
          Device.modelName ??
          Device.deviceName ??
          'Dispositivo desconocido';

        setIdentity({ serialNumber, deviceModel, isReady: true });
      } catch (error) {
        const fallback = `device-${Platform.OS}-${Date.now()}`;
        setIdentity({
          serialNumber: fallback,
          deviceModel: Device.modelName ?? 'Dispositivo desconocido',
          isReady: true,
        });
      }
    }

    resolveDeviceIdentity();
  }, []);

  return identity;
}
