import { useEffect, useRef } from 'react';
import { NativeEventEmitter, NativeModules } from 'react-native';

const { DeviceModule } = NativeModules;

const EVENT_DEVICE_STATE_CHANGED = 'onDeviceStateChanged';

/**
 * Hook que escucha cambios de estado del dispositivo emitidos por el servicio nativo.
 * Cuando el servidor marca el dispositivo como bloqueado/desbloqueado, el servicio
 * Java emite un evento que este hook detecta.
 * 
 * @param onBlocked Callback cuando el dispositivo se bloquea
 * @param onUnblocked Callback cuando el dispositivo se desbloquea
 */
export function useDeviceStateListener(
  onBlocked?: () => void,
  onUnblocked?: () => void
) {
  const onBlockedRef = useRef(onBlocked);
  const onUnblockedRef = useRef(onUnblocked);

  // Actualizar refs para tener los callbacks más recientes
  useEffect(() => {
    onBlockedRef.current = onBlocked;
    onUnblockedRef.current = onUnblocked;
  }, [onBlocked, onUnblocked]);

  useEffect(() => {
    // Solo Android tiene el módulo nativo
    if (!DeviceModule) {
      console.warn('[DG] DeviceModule not available');
      return;
    }

    const eventEmitter = new NativeEventEmitter(DeviceModule);

    const subscription = eventEmitter.addListener(
      EVENT_DEVICE_STATE_CHANGED,
      (blocked: boolean) => {
        
        if (blocked) {
          onBlockedRef.current?.();
        } else {
          onUnblockedRef.current?.();
        }
      }
    );

    return () => {
      subscription.remove();
    };
  }, []);
}
