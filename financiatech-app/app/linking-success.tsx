import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { YStack, Text, XStack } from "tamagui";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Dimensions, NativeModules, Platform } from "react-native";
import Constants from "expo-constants";
import { provisioningService } from "@/src/services/provisioning.service";
import { useKioskMode } from "@/src/hooks/useKioskMode";
import { useDeviceStateListener } from "@/src/hooks/useDeviceStateListener";
import { COLORS } from "@/src/constants/theme.constant";

const { height } = Dimensions.get("window");

export default function LinkingSuccessScreen() {
  const { deviceName, adminName, serialNumber } = useLocalSearchParams<{
    deviceName: string;
    serialNumber: string;
    adminName: string;
  }>();

  const router = useRouter();
  const isBlockedRef = useRef(false);
  const kioskControl = useKioskMode(false);

  useDeviceStateListener(
    async () => {
      if (!isBlockedRef.current) {
        isBlockedRef.current = true;
        router.replace({ pathname: "/device-blocked" });
      }
    },
    async () => {
      await kioskControl.stopKiosk();
    }
  );

  useEffect(() => {
    const checkInitialBlockedState = async () => {
      if (!serialNumber) return;
      try {
        const status = await provisioningService.checkStatus(serialNumber as string);
        if (!status.blocked) {
          await kioskControl.stopKiosk();
        }
      } catch (e) {
        console.warn("[DG] Error checking initial blocked state:", e);}
    };

    checkInitialBlockedState();
  }, [serialNumber]);

  useFocusEffect(
    React.useCallback(() => {
      kioskControl.stopKiosk().catch(() => {});
    }, [kioskControl])
  );

  useEffect(() => {
    if (!serialNumber || Platform.OS !== "android") return;
    const { DeviceModule } = NativeModules;
    if (!DeviceModule?.initPollingService) return;
    const apiUrl = Constants.expoConfig?.extra?.API_URL;
    if (!apiUrl) {
      console.error("[DG] FATAL: API_URL no está configurada en app.config");
      throw new Error("Falta configurar API_URL en app.config");
    }
    
    console.log("[DG] Iniciando servicio de polling con serialNumber:", serialNumber);
    
    DeviceModule.initPollingService(serialNumber as string, apiUrl)
      .then((result: string) => {
        console.log("[DG] Servicio de polling iniciado exitosamente:", result);
      })
      .catch((error: any) => {
        console.error("[DG] Error al iniciar servicio de polling:", error);
        
        if (error.code === "NOT_DEVICE_OWNER") {
          console.error("[DG] El dispositivo NO es Device Owner. Debe activarse desde financiatech-desktop primero.");
        } else if (error.code === "SECURITY_ERROR") {
          console.error("[DG] Error de seguridad al aplicar restricciones:", error.message);
        } else if (error.code === "RESTRICTION_ERROR") {
          console.error("[DG] Error al aplicar restricciones:", error.message);
        } else {
          console.error("[DG] Error desconocido:", error.message);
        }
      });
  }, [serialNumber]);

  // NOTA: No hay polling local de React Native.
  // El servicio nativo Java emite eventos cuando el estado cambia.

  // evita salir de esta pantalla; el dispositivo ya está sincronizado
  // pero permite que se navegue a device-blocked si fue bloqueado
  const navigation = useNavigation();
  useEffect(() => {
    const unsub = navigation.addListener("beforeRemove", (e: any) => {
      // permite la navegación programada a device-blocked (cuando se bloquea remotamente)
      if (e.data?.action?.payload?.name === "device-blocked") {
        return;
      }
      // bloquea intentos manuales del usuario (botones atrás, swipe back, etc)
      e.preventDefault();
    });
    return unsub;
  }, [navigation]);

  return (
    <YStack
      flex={1}
      backgroundColor={COLORS.background.base}
      paddingHorizontal="$5"
      justifyContent="center"
      alignItems="center"
      gap="$8"
    >
      {/* Badge de éxito */}
      <YStack alignItems="center" gap="$4">
        <YStack
          width={110}
          height={110}
          borderRadius={14}
          backgroundColor={COLORS.primary.dark}
          borderWidth={2}
          borderColor={COLORS.primary.border}
          justifyContent="center"
          alignItems="center"
        >
          <YStack
            width={80}
            height={80}
            borderRadius={10}
            backgroundColor={COLORS.primary.main}
            justifyContent="center"
            alignItems="center"
          >
            <FontAwesome name="check" size={40} color="white" />
          </YStack>
        </YStack>

        <YStack gap="$1" alignItems="center" paddingHorizontal="$3">
          <Text fontSize={28} fontWeight="800" color="white" textAlign="center">
            ¡Dispositivo Vinculado!
          </Text>
          <Text
            fontSize={14}
            color={COLORS.text.secondary}
            textAlign="center"
            maxWidth={300}
            lineHeight={20}
          >
            Bajo la protección de{" "}
            <Text fontWeight="700" color="white">
              FinanciaTech
            </Text>
          </Text>
        </YStack>
      </YStack>

      {/* Card principal — grande, centrada, imponente */}
      <YStack
        width="100%"
        borderRadius={28}
        backgroundColor={COLORS.background.elevated}
        borderWidth={1}
        borderColor={COLORS.border.main}
        overflow="hidden"
      >
        {/* Franja superior */}
        <YStack height={5} backgroundColor={COLORS.primary.main} />

        <YStack paddingVertical="$6" paddingHorizontal="$7" gap="$6">
          {/* ORGANIZACIÓN */}
          <YStack gap="$2">
            <XStack alignItems="center" gap="$2">
              <YStack
                width={3}
                height={14}
                borderRadius={2}
                backgroundColor={COLORS.primary.main}
              />
              <Text
                fontSize={11}
                color={COLORS.text.tertiary}
                letterSpacing={1.5}
                fontWeight="600"
              >
                ORGANIZACIÓN
              </Text>
            </XStack>
            <Text
              fontSize={26}
              color="white"
              fontWeight="800"
              letterSpacing={-0.3}
            >
              {adminName || "—"}
            </Text>
          </YStack>

          {/* Divisor */}
          <YStack height={1} backgroundColor={COLORS.border.subtle} />

          {/* DISPOSITIVO */}
          <YStack gap="$2">
            <XStack alignItems="center" gap="$2">
              <YStack
                width={3}
                height={14}
                borderRadius={2}
                backgroundColor={COLORS.primary.main}
              />
              <Text
                fontSize={11}
                color={COLORS.text.tertiary}
                letterSpacing={1.5}
                fontWeight="600"
              >
                DISPOSITIVO
              </Text>
            </XStack>
            <Text
              fontSize={26}
              color="white"
              fontWeight="800"
              letterSpacing={-0.3}
            >
              {deviceName || "—"}
            </Text>
          </YStack>

          {/* Divisor */}
          <YStack height={1} backgroundColor={COLORS.border.subtle} />

          {/* Estado */}
          <XStack alignItems="center" gap="$3">
            <YStack
              width={10}
              height={10}
              borderRadius={5}
              backgroundColor={COLORS.success.main}
            />
            <Text fontSize={13} color={COLORS.success.main} fontWeight="600">
              Monitoreo activo
            </Text>
          </XStack>
        </YStack>
      </YStack>

      {/* Footer */}
      <Text fontSize={10} color={COLORS.text.muted} letterSpacing={1} textAlign="center">
        FINANCIATECH SECURITY PROTOCOL V4.6
      </Text>
    </YStack>
  );
}
