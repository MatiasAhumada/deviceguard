import messaging from '@react-native-firebase/messaging';
import { Platform, Alert } from 'react-native';
import { PermissionsAndroid } from 'react-native';

/**
 * Servicio para manejar las notificaciones push con Firebase
 */

/**
 * Crea un canal de notificación para Android
 * Requerido para Android 8.0+
 */
async function createNotificationChannel() {
  if (Platform.OS === 'android') {
    try {
      const channel = await messaging().createChannel({
        id: 'default',
        name: 'Notificaciones FinanciaTech',
        description: 'Notificaciones importantes de FinanciaTech',
        sound: 'default',
        vibration: true,
        importance: 4,
        visibility: 1,
        enableLights: true,
        enableVibration: true,
        bypassDnd: true,
        showBadge: true,
      });
    } catch (error) {
      console.error('[FCM] Error al crear canal:', error);
    }
  }
}

/**
 * Solicita permisos para mostrar notificaciones
 */
export async function requestNotificationPermission(): Promise<boolean> {
  try {
    await createNotificationChannel();

    if (Platform.OS === 'android') {
      if (Platform.Version >= 33) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          console.warn('[FCM] Permiso de notificaciones denegado');
          return false;
        }
      }
    }

    const authStatus = await messaging().requestPermission({
      alert: true,
      badge: true,
      sound: true,
      provisional: false,
    });
    
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    return enabled;
  } catch (error) {
    console.error('[FCM] Error al solicitar permisos:', error);
    return false;
  }
}

/**
 * Obtiene el token FCM del dispositivo
 * Este token debe enviarse al backend para poder enviar notificaciones
 */
export async function getFCMToken(): Promise<string | null> {
  try {
    const token = await messaging().getToken();
    return token;
  } catch (error) {
    console.error('[FCM] Error al obtener token:', error);
    return null;
  }
}

/**
 * Configura el listener para mensajes en primer plano
 */
export function setupForegroundListener(
  onMessageReceived: (message: any) => void
) {
  const unsubscribe = messaging().onMessage(async (remoteMessage) => {
    onMessageReceived(remoteMessage);
  });

  return unsubscribe;
}

/**
 * Configura el listener para cuando se toca una notificación
 */
export function setupNotificationOpenedListener(
  onNotificationOpened: (message: any) => void
) {
  const unsubscribe = messaging().onNotificationOpenedApp(async (remoteMessage) => {
    onNotificationOpened(remoteMessage);
  });

  return unsubscribe;
}

/**
 * Verifica si hay una notificación que abrió la app desde estado cerrado
 */
export async function checkInitialNotification(
  onNotificationOpened: (message: any) => void
) {
  try {
    const initialNotification = await messaging().getInitialNotification();
    if (initialNotification) {
      onNotificationOpened(initialNotification);
    }
  } catch (error) {
    console.error('[FCM] Error al verificar notificación inicial:', error);
  }
}

/**
 * Configura el listener para tokens actualizados
 * El token puede cambiar cuando se reinstala la app o se borran datos
 */
export function setupTokenRefreshListener(
  onTokenRefresh: (token: string) => void
) {
  const unsubscribe = messaging().onTokenRefresh(async (token) => {
    onTokenRefresh(token);
  });

  return unsubscribe;
}

/**
 * Inicializa Firebase Messaging
 * Debe llamarse al iniciar la app
 */
export async function initializeMessaging(
  callbacks: {
    onMessageReceived?: (message: any) => void;
    onNotificationOpened?: (message: any) => void;
    onTokenRefresh?: (token: string) => void;
  }
): Promise<string | null> {
  try {
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      console.warn('[FCM] Permisos de notificación denegados');
      return null;
    }

    const token = await getFCMToken();
    if (!token) {
      console.warn('[FCM] No se pudo obtener token');
      return null;
    }

    if (callbacks.onMessageReceived) {
      setupForegroundListener(callbacks.onMessageReceived);
    }

    if (callbacks.onNotificationOpened) {
      setupNotificationOpenedListener(callbacks.onNotificationOpened);
      checkInitialNotification(callbacks.onNotificationOpened);
    }

    if (callbacks.onTokenRefresh) {
      setupTokenRefreshListener(callbacks.onTokenRefresh);
    }

    return token;
  } catch (error) {
    console.error('[FCM] Error al inicializar:', error);
    return null;
  }
}
