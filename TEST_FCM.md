# Pruebas de Notificaciones FCM - Bloqueo/Desbloqueo

## Cambios Realizados

### Backend (financiatech-web)
1. **fcm.ts**: Agregado `collapseKey` y `ttl` para mejorar entrega de mensajes
2. Los mensajes FCM ahora incluyen:
   - `priority: "high"`
   - `collapseKey`: tipo de mensaje (DEVICE_BLOCKED/DEVICE_UNBLOCKED)
   - `ttl`: 3600000ms (1 hora)

### Mobile App (financiatech-app)
1. **FinanciaTechFirebaseService.java**: 
   - Agregados logs detallados para debugging
   - Maneja tanto `action` como `type` en mensajes FCM
   - Soporta `DEVICE_BLOCKED` y `DEVICE_UNBLOCKED`

## Comandos de Prueba

### 1. Verificar logs en tiempo real
```bash
adb logcat -s FTFirebaseService:* *:E
```

### 2. Bloquear dispositivo desde panel web
- Ir al panel de admin
- Seleccionar dispositivo
- Click en botón "Bloquear"
- Verificar logs en consola del backend
- Verificar logs en logcat del dispositivo

### 3. Desbloquear dispositivo desde panel web
- Ir al panel de admin
- Seleccionar dispositivo bloqueado
- Click en botón "Desbloquear"
- Verificar logs

## Logs Esperados

### Backend
```
[FCM-SERVICE] Starting sendToDevice: { serialNumber: 'R8YYA0GG8XW', type: 'DEVICE_BLOCKED' }
[FCM-SERVICE] DeviceSync found: { hasDeviceSync: true, hasFcmToken: true }
[FCM-SERVICE] Sending via Firebase...
[FCM-SERVICE] Firebase response: projects/.../messages/...
```

### Mobile App
```
D FTFirebaseService: Message received from: ...
D FTFirebaseService: Message ID: ...
D FTFirebaseService: Message priority: 1
D FTFirebaseService: Message data payload: {type=DEVICE_BLOCKED, deviceId=..., serialNumber=R8YYA0GG8XW, timestamp=...}
D FTFirebaseService: Handling data message - action: null, type: DEVICE_BLOCKED
I FTFirebaseService: Received BLOCK command via Firebase
I FTFirebaseService: Executing blockDevice()
D FTFirebaseService: Preferences updated - isLocked: true
D FTFirebaseService: Restrictions applied, starting MainActivity
I FTFirebaseService: Block device completed
```

## Verificación de Estado

### Verificar FCM Token registrado
```bash
adb shell run-as com.financiatech.kiosk cat /data/data/com.financiatech.kiosk/shared_prefs/FinanciaTechPrefs.xml | findstr fcmToken
```

### Verificar estado de bloqueo
```bash
adb shell run-as com.financiatech.kiosk cat /data/data/com.financiatech.kiosk/shared_prefs/FinanciaTechPrefs.xml | findstr isLocked
```

## Troubleshooting

### Si no llegan mensajes FCM:
1. Verificar que el token FCM esté registrado en el backend
2. Verificar que la app esté en foreground o background (no force-stopped)
3. Verificar conectividad a internet del dispositivo
4. Verificar logs del backend para errores de Firebase Admin SDK

### Si llegan mensajes pero no ejecutan acción:
1. Verificar logs de `handleDataMessage()` 
2. Verificar que el campo `type` tenga valor correcto
3. Verificar permisos de Device Owner
4. Verificar que SharedPreferences se actualicen correctamente
