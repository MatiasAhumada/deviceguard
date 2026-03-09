/**
 * Servicio para enviar notificaciones push a través de Firebase Cloud Messaging
 */

// Nota: Para usar FCM admin SDK, necesitas instalar:
// npm install firebase-admin

let admin: typeof import("firebase-admin") | null = null;

// Inicializar Firebase Admin SDK
function initializeFirebase() {
  if (admin) return admin;

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    admin = require("firebase-admin");

    // Inicializar solo si no está ya inicializado
    if (admin.apps.length === 0) {
      // Usar variables de entorno para las credenciales de Firebase
      const firebaseConfig = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      };

      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: firebaseConfig.projectId,
          clientEmail: firebaseConfig.clientEmail,
          privateKey: firebaseConfig.privateKey,
        }),
      });
    }

    return admin;
  } catch (error) {
    console.warn("Firebase Admin SDK no está disponible. Las notificaciones push no funcionarán.");
    console.warn("Para habilitar: npm install firebase-admin y configura las variables de entorno");
    return null;
  }
}

/**
 * Envía una notificación push a un dispositivo
 */
export async function sendPushNotification(
  token: string,
  notification: {
    title: string;
    body: string;
    data?: Record<string, string>;
  }
): Promise<boolean> {
  const firebaseAdmin = initializeFirebase();

 

  try {
    const message: admin.messaging.Message = {
      notification: {
        title: notification.title,
        body: notification.body,
      },
      data: notification.data,
      token,
      android: {
        priority: 'high',
        notification: {
          channelId: 'default',
          priority: 'high',
          visibility: 'public',
          defaultSound: true,
          defaultVibrateTimings: true,
          defaultLightSettings: true,
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    };

    await firebaseAdmin.messaging().send(message);
    return true;
  } catch (error) {
    console.error("[FCM] Error al enviar notificación:", error);
    return false;
  }
}

/**
 * Envía notificaciones a múltiples dispositivos (topic)
 */
export async function sendTopicNotification(
  topic: string,
  notification: {
    title: string;
    body: string;
    data?: Record<string, string>;
  }
): Promise<boolean> {
  const firebaseAdmin = initializeFirebase();

  if (!firebaseAdmin) {
    return true;
  }

  try {
    const message: admin.messaging.Message = {
      notification: {
        title: notification.title,
        body: notification.body,
      },
      data: notification.data,
      topic,
    };

    const response = await firebaseAdmin.messaging().send(message);
    return true;
  } catch (error) {
    console.error("[FCM] Error al enviar notificación a topic:", error);
    return false;
  }
}
