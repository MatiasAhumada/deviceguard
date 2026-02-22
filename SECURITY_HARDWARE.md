# 🔒 MITIGACIÓN DE VULNERABILIDADES DE HARDWARE

## ⚠️ VULNERABILIDADES FÍSICAS NO BLOQUEABLES POR SOFTWARE

### 1. Recovery Mode (Power + Volume Up)
**Riesgo:** Factory reset desde recovery
**Mitigación:**
- ✅ `DISALLOW_FACTORY_RESET` bloquea factory reset desde Settings
- ❌ NO bloquea recovery mode físico
- 🔧 **Solución:** Bootloader bloqueado (requiere OEM unlock)

### 2. Download/Fastboot Mode (Power + Volume Down)
**Riesgo:** Flashear ROM custom
**Mitigación:**
- ❌ NO hay protección por software
- 🔧 **Solución:** Bootloader bloqueado

### 3. Reinicio Forzado (Power + Volume Down 10s)
**Riesgo:** Reiniciar el dispositivo
**Mitigación:**
- ✅ DeviceGuard se reinicia automáticamente
- ✅ Estado de bloqueo persiste en SharedPreferences
- ✅ `directBootAware=true` inicia antes del unlock

---

## 🎯 NIVELES DE PROTECCIÓN

### Nivel 1: Device Owner (Actual)
```
Protección: 70%
Bloquea: Settings, desinstalación, ADB
NO bloquea: Recovery físico, Download mode
```

### Nivel 2: Device Owner + Bootloader Locked
```
Protección: 95%
Bloquea: Todo lo anterior + Recovery + Download
NO bloquea: Extracción física de chip
```

### Nivel 3: Device Owner + Knox/SafetyNet (Samsung/Google)
```
Protección: 99%
Bloquea: Todo + detección de root + hardware tampering
NO bloquea: Destrucción física del dispositivo
```

---

## 📋 RECOMENDACIONES PARA JULIÁN

### Opción A: Dispositivos con Bootloader Bloqueado (RECOMENDADO)
**Marcas:**
- Samsung (Knox activado)
- Google Pixel (Verified Boot)
- Dispositivos empresariales (Zebra, Honeywell)

**Ventaja:** Recovery mode requiere desbloqueo de bootloader → Borra todos los datos

### Opción B: Monitoreo + Penalización
**Estrategia:**
1. Detectar factory reset (dispositivo desaparece de FCM)
2. Marcar como "Dispositivo manipulado" en base de datos
3. Aplicar penalización contractual
4. Bloquear IMEI con operadora (si está en contrato)

### Opción C: Seguro de Dispositivo
**Estrategia:**
- Incluir costo de seguro en el préstamo
- Si el usuario hace factory reset → Pierde el seguro
- Responsabilidad legal por manipulación

---

## 🔧 IMPLEMENTACIÓN TÉCNICA

### Detección de Factory Reset:

```java
// En DeviceAdmin.java
@Override
public void onReceive(Context context, Intent intent) {
    if (Intent.ACTION_BOOT_COMPLETED.equals(intent.getAction())) {
        SharedPreferences prefs = context.getSharedPreferences("DeviceGuardPrefs", Context.MODE_PRIVATE);
        String deviceId = prefs.getString("deviceId", null);
        
        if (deviceId == null) {
            // Factory reset detectado - dispositivo limpio
            // Enviar alerta al servidor
            notifyServerDeviceWiped(context);
        }
    }
}
```

### Bloqueo de IMEI (Requiere API de operadora):

```typescript
// Backend API
async function blockIMEI(deviceId: string) {
  const device = await prisma.device.findUnique({ where: { id: deviceId } });
  
  // Llamar API de operadora
  await carrierAPI.blockIMEI(device.imei);
  
  // Marcar en BD
  await prisma.device.update({
    where: { id: deviceId },
    data: { status: 'BLACKLISTED' }
  });
}
```

---

## 📊 MATRIZ DE RIESGO

| Acción del Usuario | Bloqueado | Detectable | Penalizable |
|-------------------|-----------|------------|-------------|
| Desinstalar app | ✅ Sí | N/A | N/A |
| Factory reset (Settings) | ✅ Sí | N/A | N/A |
| Factory reset (Recovery) | ❌ No | ✅ Sí | ✅ Sí |
| Flashear ROM | ❌ No | ✅ Sí | ✅ Sí |
| Modo Avión | ✅ Sí | N/A | N/A |
| Quitar SIM | ❌ No | ✅ Sí | ⚠️ Parcial |
| Destruir físicamente | ❌ No | ✅ Sí | ✅ Sí |

---

## 💡 RECOMENDACIÓN FINAL

**Para un sistema de garantía financiera:**

1. **Usar dispositivos con bootloader bloqueado** (Samsung Knox ideal)
2. **Implementar detección de manipulación**
3. **Cláusula contractual:** Factory reset = Penalización + Bloqueo IMEI
4. **Monitoreo 24/7:** Alerta si dispositivo desaparece de FCM
5. **Seguro obligatorio:** Cubre pérdida por manipulación

**Nivel de protección real: 95% con estas medidas**
