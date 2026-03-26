# Plan de Refactor de Colores — FinanciaTech Mobile App

## Contexto del Proyecto

FinanciaTech Mobile es una aplicación React Native + Expo que funciona como cliente de kiosk mode para dispositivos Android.

**Stack técnico:**
- **Framework**: React Native 0.81.5 + Expo SDK 54
- **UI Library**: Tamagui 2.0
- **Routing**: Expo Router v6
- **Notificaciones**: Firebase Cloud Messaging
- **Módulos nativos**: Java (Device Admin, Kiosk Mode, Polling Service)

### Estructura de pantallas

```
app/
├── provisioning.tsx        # Ingreso de código de activación (fondo negro)
├── linking.tsx             # Animación de vinculación
├── linking-success.tsx     # Dispositivo vinculado (fondo negro + card azul oscuro)
├── linking-error.tsx       # Error de vinculación
├── device-blocked.tsx      # Pantalla de bloqueo (fondo negro + rojo)
└── payment-methods.tsx     # Métodos de pago (fondo negro)
```

---

## Paleta Actual vs Nueva Paleta

### Colores actuales identificados en el código

| Uso | Color actual | Ubicación |
|---|---|---|
| **Fondo principal** | `#000000` (negro puro) | Todas las pantallas |
| **Fondo secundario oscuro** | `#0F172A` (slate-900) | Cards en linking-success |
| **Fondo cards/containers** | `#1F2937` (gray-800) | device-blocked, payment-methods |
| **Primario/Acento (rojo)** | `#DC2626` (red-600) | Botones, íconos de bloqueo |
| **Rojo oscuro** | `#450A0A` (red-950) | Fondos de badges de error |
| **Rojo medio** | `#B91C1C` (red-700) | Badges de éxito, franjas |
| **Borde rojo oscuro** | `#7F1D1D` (red-900) | Bordes de badges |
| **Texto secundario** | `#9CA3AF` (gray-400) | Descripciones, labels |
| **Texto terciario** | `#6B7280` (gray-500) | Info secundaria |
| **Texto muted** | `#4B5563` (gray-600) | IDs, footers |
| **Divisores** | `#1E293B` (slate-800) | Separadores en cards |
| **Bordes azules** | `#1E3A5F` (blue-900) | Borde de card principal |
| **Success verde** | `#22C55E` (green-500) | Indicador de monitoreo activo |
| **Gris oscuro** | `#374151` (gray-700) | Íconos de info |

### Nueva paleta del cliente (desde web)

| Color | Hex | Rol semántico |
|---|---|---|
| **Deep Teal** | `#032831` | Fondo base (reemplaza `#000000`) |
| **Blue Primary** | `#4583FA` | Primario/acento (reemplaza `#DC2626`, `#B91C1C`) |
| **Sky Blue** | `#36B2F2` | Secundario/info/hover |
| **White** | `#FFFFFF` | Texto principal, fondos claros |
| **Mint Green** | `#3DE3B1` | Success (reemplaza `#22C55E`) |

---

## Mapeo de Colores: Actual → Nuevo

### Fondos

| Actual | Nuevo | Justificación |
|---|---|---|
| `#000000` (negro puro) | `#032831` | Fondo base deep teal |
| `#0F172A` (slate-900) | `#053d4a` | Variante más clara del teal para cards principales |
| `#1F2937` (gray-800) | `#064e5f` | Variante media del teal para containers |
| `#374151` (gray-700) | `#0a5f73` | Variante clara del teal para elementos interactivos |

### Primarios y acentos

| Actual | Nuevo | Justificación |
|---|---|---|
| `#DC2626` (red-600) | `#4583FA` | Azul primario para botones y acciones |
| `#B91C1C` (red-700) | `#4583FA` | Mismo azul primario |
| `#450A0A` (red-950) | `#1a3d7a` | Azul oscuro para fondos de badges |
| `#7F1D1D` (red-900) | `#2d5bb5` | Azul medio para bordes |
| `#1E3A5F` (blue-900) | `#36B2F2` | Sky blue para bordes de cards |

### Estados y feedback

| Actual | Nuevo | Justificación |
|---|---|---|
| `#22C55E` (green-500) | `#3DE3B1` | Mint green para success |
| `#DC2626` (red-600) en íconos de bloqueo | `#4583FA` | Azul primario (el bloqueo ya no es "peligro", es "control") |

### Textos (mantener con ajustes)

| Actual | Nuevo | Justificación |
|---|---|---|
| `#FFFFFF` (white) | `#FFFFFF` | Mantener para texto principal |
| `#9CA3AF` (gray-400) | `#a8c5d1` | Gris azulado para texto secundario sobre teal |
| `#6B7280` (gray-500) | `#7a9fad` | Gris azulado más oscuro |
| `#4B5563` (gray-600) | `#5a7f8f` | Gris azulado aún más oscuro |

---

## Archivos a Modificar

### 1. Configuración de colores nativos Android

**`android/app/src/main/res/values/colors.xml`**

```xml
<resources>
  <color name="splashscreen_background">#032831</color>
  <color name="iconBackground">#032831</color>
  <color name="colorPrimary">#4583FA</color>
  <color name="colorPrimaryDark">#032831</color>
</resources>
```

### 2. Constantes de TypeScript

**`constants/Colors.ts`**

```ts
const tintColorLight = '#4583FA';
const tintColorDark = '#36B2F2';

export default {
  light: {
    text: '#032831',
    background: '#FFFFFF',
    tint: tintColorLight,
    tabIconDefault: '#7a9fad',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#FFFFFF',
    background: '#032831',
    tint: tintColorDark,
    tabIconDefault: '#7a9fad',
    tabIconSelected: tintColorDark,
  },
};
```

### 3. Crear archivo de tokens de diseño

**`constants/theme.constant.ts`** (nuevo archivo)

```ts
export const COLORS = {
  // Fondos
  background: {
    base: '#032831',        // Deep teal
    elevated: '#053d4a',    // Cards principales
    container: '#064e5f',   // Containers secundarios
    interactive: '#0a5f73', // Elementos interactivos
  },
  
  // Primarios
  primary: {
    main: '#4583FA',        // Blue primary
    dark: '#1a3d7a',        // Para badges oscuros
    light: '#7aaafb',       // Para hover/pressed
    border: '#2d5bb5',      // Bordes
  },
  
  // Secundarios
  secondary: {
    main: '#36B2F2',        // Sky blue
    light: '#5cc3f7',       // Variante clara
  },
  
  // Estados
  success: {
    main: '#3DE3B1',        // Mint green
    dark: '#1fb88a',        // Variante oscura
  },
  
  warning: {
    main: '#F59E0B',        // Mantener naranja
  },
  
  // Textos
  text: {
    primary: '#FFFFFF',
    secondary: '#a8c5d1',   // Gris azulado claro
    tertiary: '#7a9fad',    // Gris azulado medio
    muted: '#5a7f8f',       // Gris azulado oscuro
  },
  
  // Divisores y bordes
  border: {
    main: '#36B2F2',        // Sky blue
    subtle: '#064e5f',      // Teal medio
  },
} as const;
```

### 4. Pantallas a actualizar

#### **`app/provisioning.tsx`**

```tsx
// Cambios:
backgroundColor="#000000" → backgroundColor={COLORS.background.base}
backgroundColor="#DC2626" → backgroundColor={COLORS.primary.main}
backgroundColor="#450A0A" → backgroundColor={COLORS.primary.dark}
color="#FCA5A5" → color={COLORS.primary.light}
```

#### **`app/device-blocked.tsx`**

```tsx
// Cambios:
backgroundColor="#000000" → backgroundColor={COLORS.background.base}
backgroundColor="#450A0A" → backgroundColor={COLORS.primary.dark}
backgroundColor="#1F2937" → backgroundColor={COLORS.background.container}
backgroundColor="#DC2626" (ícono lock) → color={COLORS.primary.main}
backgroundColor="#DC2626" (botón) → backgroundColor={COLORS.primary.main}
color="#9CA3AF" → color={COLORS.text.secondary}
color="#6B7280" → color={COLORS.text.tertiary}
color="#4B5563" → color={COLORS.text.muted}
backgroundColor="#374151" → backgroundColor={COLORS.background.interactive}
```

#### **`app/linking-success.tsx`**

```tsx
// Cambios:
backgroundColor="#000000" → backgroundColor={COLORS.background.base}
backgroundColor="#450A0A" → backgroundColor={COLORS.primary.dark}
borderColor="#7F1D1D" → borderColor={COLORS.primary.border}
backgroundColor="#B91C1C" → backgroundColor={COLORS.primary.main}
backgroundColor="#0F172A" → backgroundColor={COLORS.background.elevated}
borderColor="#1E3A5F" → borderColor={COLORS.border.main}
backgroundColor="#B91C1C" (franja) → backgroundColor={COLORS.primary.main}
backgroundColor="#B91C1C" (indicadores) → backgroundColor={COLORS.primary.main}
color="#9CA3AF" → color={COLORS.text.secondary}
color="#6B7280" → color={COLORS.text.tertiary}
backgroundColor="#1E293B" → backgroundColor={COLORS.border.subtle}
backgroundColor="#22C55E" → backgroundColor={COLORS.success.main}
color="#22C55E" → color={COLORS.success.main}
color="#374151" → color={COLORS.text.muted}
```

#### **`app/linking-error.tsx`**

```tsx
// Cambios:
backgroundColor="#000000" → backgroundColor={COLORS.background.base}
backgroundColor="#450A0A" → backgroundColor={COLORS.primary.dark}
backgroundColor="#DC2626" → backgroundColor={COLORS.primary.main}
backgroundColor="#DC2626" (botón) → backgroundColor={COLORS.primary.main}
color="#9CA3AF" → color={COLORS.text.secondary}
color="#6B7280" → color={COLORS.text.tertiary}
```

#### **`app/payment-methods.tsx`**

```tsx
// Cambios:
backgroundColor="#000000" → backgroundColor={COLORS.background.base}
backgroundColor="#DC2626" (indicador) → backgroundColor={COLORS.primary.main}
backgroundColor="#1F2937" → backgroundColor={COLORS.background.container}
borderColor="#374151" → borderColor={COLORS.background.interactive}
backgroundColor="#450A0A" → backgroundColor={COLORS.primary.dark}
color="#DC2626" → color={COLORS.primary.main}
color="#9CA3AF" → color={COLORS.text.secondary}
color="#6B7280" → color={COLORS.text.tertiary}
color="#4B5563" → color={COLORS.text.muted}
backgroundColor="#E5E7EB" (botón volver) → backgroundColor={COLORS.secondary.main}
```

#### **`app/linking.tsx`**

```tsx
// Cambios en LinkingAnimation.tsx:
colors={["rgba(220, 38, 38, 0)", "rgba(220, 38, 38, 0.4)", "#DC2626"]}
→
colors={["rgba(69, 131, 250, 0)", "rgba(69, 131, 250, 0.4)", "#4583FA"]}

backgroundColor="#DC2626" → backgroundColor={COLORS.primary.main}
shadowColor="#DC2626" → shadowColor={COLORS.primary.main}
backgroundColor="#10B981" → backgroundColor={COLORS.success.main}
shadowColor="#10B981" → shadowColor={COLORS.success.main}
color="#DC2626" → color={COLORS.primary.main}
color="#6B7280" → color={COLORS.text.tertiary}
color="#4B5563" → color={COLORS.text.muted}
```

### 5. Componentes compartidos

#### **`components/provisioning/BrandLogo.tsx`**

```tsx
// Cambio:
backgroundColor="#DC2626" → backgroundColor={COLORS.primary.main}
```

#### **`components/provisioning/CodeInput.tsx`**

```tsx
// Cambio:
borderColor="#DC2626" → borderColor={COLORS.primary.main}
```

#### **`components/linking/LinkingAnimation.tsx`**

```tsx
// Cambios en gradientes y colores de radar:
"#DC2626" → COLORS.primary.main
"#10B981" → COLORS.success.main
```

---

## Mejoras de UI y UX

### Problemas identificados en `payment-methods.tsx`

#### 1. Íconos desfasados y desalineados

**Problema actual:**
- El ícono de "copy" en la card de transferencia tiene `marginTop="$2"` que lo desalinea
- Los íconos decorativos de la derecha no tienen función pero ocupan mucho espacio (56x56px)
- El ícono de "money" se repite dos veces innecesariamente

**Solución:**
```tsx
// ANTES:
<YStack
  width={56}
  height={56}
  borderRadius={14}
  backgroundColor="#374151"
  justifyContent="center"
  alignItems="center"
>
  <FontAwesome name="money" size={28} color="#6B7280" />
</YStack>

// DESPUÉS: Eliminar íconos decorativos redundantes
// Solo mantener el ícono principal de cada método
```

#### 2. Cards demasiado grandes y con padding excesivo

**Problema actual:**
- `padding="$6"` (24px) hace las cards muy espaciosas
- `gap="$4"` entre elementos internos es excesivo
- Las cards ocupan demasiado espacio vertical

**Solución:**
```tsx
// ANTES:
<YStack
  backgroundColor="#1F2937"
  borderRadius={20}
  padding="$6"  // 24px
  gap="$4"      // 16px
>

// DESPUÉS:
<YStack
  backgroundColor={COLORS.background.container}
  borderRadius={16}  // Más compacto
  padding="$4"       // 16px
  gap="$3"           // 12px
>
```

#### 3. Jerarquía visual mejorada

**Cambios propuestos:**

1. **Header más compacto:**
```tsx
// Reducir fontSize del título de 32 → 28
// Reducir height de la barra indicadora de 32 → 24
<Text fontSize={28} fontWeight="800" color="white">
  MÉTODOS DE PAGO
</Text>
```

2. **Cards con mejor estructura:**
```tsx
<YStack
  backgroundColor={COLORS.background.container}
  borderRadius={16}
  padding="$4"
  gap="$3"
  borderWidth={1}
  borderColor={COLORS.background.interactive}
>
  {/* Header de la card */}
  <XStack gap="$3" alignItems="center">
    <YStack
      width={48}      // Reducido de 56
      height={48}     // Reducido de 56
      borderRadius={12}
      backgroundColor={COLORS.primary.dark}
      justifyContent="center"
      alignItems="center"
    >
      <FontAwesome name="money" size={24} color={COLORS.primary.main} />
    </YStack>
    <Text fontSize={18} fontWeight="700" color="white">
      Efectivo
    </Text>
  </XStack>
  
  {/* Contenido */}
  <YStack
    gap="$2"
    paddingTop="$2"
    borderTopWidth={1}
    borderTopColor={COLORS.border.subtle}
  >
    <Text fontSize={10} color={COLORS.text.tertiary} letterSpacing={1} fontWeight="600">
      PUNTO DE PAGO
    </Text>
    <Text fontSize={14} color={COLORS.text.secondary} lineHeight={20}>
      Av. Central 123, Ciudad Capital
    </Text>
  </YStack>
</YStack>
```

3. **Botón de copiar funcional (transferencia):**
```tsx
import { Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';

const copyToClipboard = async (text: string, label: string) => {
  await Clipboard.setStringAsync(text);
  Alert.alert('Copiado', `${label} copiado al portapapeles`);
};

// En la card de transferencia:
<XStack gap="$2" alignItems="center" justifyContent="space-between">
  <YStack flex={1}>
    <Text fontSize={10} color={COLORS.text.tertiary} letterSpacing={1} fontWeight="600">
      CLABE
    </Text>
    <Text fontSize={14} color={COLORS.text.secondary} fontWeight="600">
      123456789012345678
    </Text>
  </YStack>
  <Button
    size="$3"
    circular
    backgroundColor={COLORS.primary.main}
    onPress={() => copyToClipboard('123456789012345678', 'CLABE')}
    icon={<FontAwesome name="copy" size={14} color="white" />}
  />
</XStack>
```

#### 4. Espaciado y proporciones

**Ajustes generales:**
```tsx
// Container principal
<YStack
  flex={1}
  backgroundColor={COLORS.background.base}
  paddingHorizontal="$4"
  paddingTop="$8"        // Reducido de $10
  justifyContent="space-between"
>

// Gap entre cards
<YStack gap="$3" marginTop="$4">  // Reducido de $6 y $6
  {/* Cards aquí */}
</YStack>

// Botón de volver
<Button
  backgroundColor={COLORS.secondary.main}
  borderRadius={12}      // Reducido de 14
  height={52}            // Reducido de 56
  onPress={handleBack}
>
```

### Mejoras en otras pantallas

#### **`device-blocked.tsx`**
- ✅ Estructura bien balanceada
- Cambio menor: reducir `marginTop="$6"` del primer YStack a `marginTop="$4"`

#### **`linking-success.tsx`**
- ✅ Card principal bien diseñada
- Cambio menor: ajustar `paddingVertical="$7"` a `paddingVertical="$6"` para más compacidad

#### **`provisioning.tsx`**
- ✅ Layout limpio y funcional
- Sin cambios necesarios

#### **`linking-error.tsx`**
- ✅ Diseño consistente con linking-success
- Sin cambios necesarios

---

## Orden de Ejecución Sugerido

```
1. constants/theme.constant.ts          → crear tokens centralizados
2. constants/Colors.ts                  → actualizar tints
3. android/.../values/colors.xml        → colores nativos Android
4. components/provisioning/BrandLogo    → logo con nuevo azul
5. components/provisioning/CodeInput    → borde azul
6. components/linking/LinkingAnimation  → gradientes azules
7. app/provisioning.tsx                 → fondo teal + botón azul
8. app/linking.tsx                      → animación con nuevos colores
9. app/linking-success.tsx              → card teal + acentos azules + ajuste padding
10. app/linking-error.tsx               → error con azul
11. app/device-blocked.tsx              → bloqueo con azul + ajuste marginTop
12. app/payment-methods.tsx             → REFACTOR COMPLETO:
    - Nuevos colores
    - Eliminar íconos decorativos
    - Reducir padding y gaps
    - Compactar cards
    - Agregar funcionalidad de copiar
    - Mejorar jerarquía visual
```

---

## Notas Importantes

### Diferencias con la web

- **Web**: usa Tailwind CSS con clases utilitarias
- **Mobile**: usa Tamagui con props inline y constantes

### Estrategia de migración

1. **Crear `theme.constant.ts` primero** con todos los tokens
2. **Importar en cada pantalla**: `import { COLORS } from '@/constants/theme.constant'`
3. **Reemplazar hex hardcodeados** por referencias a `COLORS.*`
4. **Ventaja**: cambios futuros de paleta solo requieren editar un archivo

### Consideraciones de UX

- El **azul** (`#4583FA`) es menos agresivo que el rojo para indicar "bloqueo"
- El **teal oscuro** (`#032831`) es más profesional que negro puro
- El **mint green** (`#3DE3B1`) mantiene la legibilidad para estados positivos
- Los **grises azulados** armonizan mejor con el fondo teal

### Testing

Después de aplicar los cambios, verificar:
- ✅ Contraste de texto sobre fondos (WCAG AA mínimo)
- ✅ Legibilidad de íconos y badges
- ✅ Splash screen y app icon (Android)
- ✅ Transiciones entre pantallas (no debe haber flashes de color)

---

## Resultado Esperado

Al finalizar, la app móvil tendrá:
- ✅ Paleta idéntica a la web (coherencia de marca)
- ✅ Fondo teal profesional en lugar de negro puro
- ✅ Azul primario en lugar de rojo (menos agresivo)
- ✅ Mint green para estados positivos
- ✅ Tokens centralizados para fácil mantenimiento
