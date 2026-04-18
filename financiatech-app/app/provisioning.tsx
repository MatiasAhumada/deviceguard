import React, { useState, useEffect } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { YStack, Text, Button } from "tamagui";
import { ScrollView, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import { ProvisioningHeader } from "@/components/provisioning/ProvisioningHeader";
import { CodeInput } from "@/components/provisioning/CodeInput";
import { useProvisioningCode } from "@/src/hooks/useProvisioningCode";
import { useDeviceImei } from "@/src/hooks/useDeviceImei";
import { provisioningService } from "@/src/services/provisioning.service";
import { validateProvisioningCode } from "@/src/utils/validation.util";
import { COLORS } from "@/src/constants/theme.constant";

const { height } = Dimensions.get("window");

export default function ProvisioningScreen() {
  const router = useRouter();
  const { code, codeString, setCodeString, getFullCode, isComplete } = useProvisioningCode();
  const { serialNumber, isReady: isDeviceReady } = useDeviceImei();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [checkingSync, setCheckingSync] = useState(true);

  const performStatusCheck = async () => {
    if (!isDeviceReady || !serialNumber) {
      setCheckingSync(false);
      return;
    }

    try {
      setCheckingSync(true);
      const status = await provisioningService.checkStatus(serialNumber);
      if (status.blocked) {
        router.replace({ pathname: "/device-blocked" });
        return;
      }
      if (status.deviceName && status.adminName) {
        router.replace({
          pathname: "/linking-success",
          params: {
            deviceName: status.deviceName,
            serialNumber,
            adminName: status.adminName,
          },
        });
        return;
      }
    } catch (err: any) {
      if (err?.response?.status !== 404) {
        console.warn("status check failed", err);
      }
    } finally {
      setCheckingSync(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      performStatusCheck();
    }, [isDeviceReady, serialNumber, router])
  );

  useEffect(() => {
    if (isDeviceReady && serialNumber) {
      performStatusCheck();
    }
  }, [isDeviceReady, serialNumber]);

  const canVerify = isComplete() && isDeviceReady && !isLoading;

  if (isDeviceReady && checkingSync) {
    return null;
  }

  const handleVerify = async () => {
    const fullCode = getFullCode();

    if (!validateProvisioningCode(fullCode)) {
      setErrorMessage("El código debe ser de 6 caracteres alfanuméricos.");
      return;
    }

    if (!serialNumber) {
      setErrorMessage("No se pudo identificar el dispositivo. Intenta reiniciar la app.");
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    try {
      let fcmToken: string | null = null;
      try {
        const { requestNotificationPermission, getFCMToken } = await import('@/src/services/firebase.service');
        const hasPermission = await requestNotificationPermission();
        if (hasPermission) {
          fcmToken = await getFCMToken();
          console.log('[PROVISIONING] FCM Token obtained:', fcmToken ? 'YES' : 'NO');
        } else {
          console.warn('[PROVISIONING] Notification permission denied');
        }
      } catch (fcmError) {
        console.warn('[PROVISIONING] Error getting FCM token:', fcmError);
      }

      const result = await provisioningService.syncDevice(fullCode, serialNumber, fcmToken || undefined);

      router.push({
        pathname: "/linking",
        params: {
          deviceName: result.deviceName,
          serialNumber: result.serialNumber,
          adminName: result.adminName,
        },
      });
    } catch (error: any) {
      if (__DEV__) {
        console.error("[provisioning] syncDevice error:", error?.message, error?.response?.data);
      }

      const serverMessage =
        error?.response?.data?.message ||
        "No se pudo completar la vinculación. Verifica el código e inténtalo de nuevo.";

      router.push({
        pathname: "/linking-error",
        params: { message: serverMessage },
      });
    } finally {
      setIsLoading(false);
    }

  };
  return (
    <YStack flex={1} backgroundColor={COLORS.background.base}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <YStack flex={1} paddingTop={height * 0.08} gap="$6">
          <ProvisioningHeader />

          <CodeInput code={code} codeString={codeString} onChangeText={setCodeString} />

          {/* Mensaje de error inline (validación local) */}
          {errorMessage && (
            <YStack backgroundColor={COLORS.primary.dark} borderRadius={8} paddingHorizontal="$4" paddingVertical="$3">
              <Text color={COLORS.primary.light} fontSize={13} textAlign="center">
                {errorMessage}
              </Text>
            </YStack>
          )}

          <Button
            backgroundColor={COLORS.primary.main}
            borderRadius={10}
            width="100%"
            alignSelf="center"
            onPress={handleVerify}
            disabled={!canVerify}
            opacity={!canVerify ? 0.5 : 1}
            pressStyle={{ opacity: 0.8 }}
          >
            <Text color="white" fontSize={18} fontWeight="800">
              {isLoading
                ? "Vinculando..."
                : !isDeviceReady
                ? "Preparando dispositivo..."
                : "Verificar y Vincular"}
            </Text>
          </Button>

        </YStack>
      </ScrollView>
    </YStack>
  );
}
