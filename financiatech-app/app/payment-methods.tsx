import { useRouter } from "expo-router";
import { YStack, Text, Button } from "tamagui";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useKioskMode } from "@/src/hooks/useKioskMode";
import { COLORS } from "@/src/constants/theme.constant";
import * as Clipboard from "expo-clipboard";
import { Alert } from "react-native";

export default function PaymentMethodsScreen() {
  const router = useRouter();
  // Mantener kiosk activo: el Lock Task Mode es a nivel de actividad,
  // no de pantalla. Si se detiene aquí, los botones del sistema vuelven.
  useKioskMode(true);

  const copyToClipboard = async (text: string, label: string) => {
    await Clipboard.setStringAsync(text);
    Alert.alert("Copiado", `${label} copiado al portapapeles`);
  };

  const handleBack = () => {
    // Navega directamente a device-blocked en lugar de usar router.back()
    // Esto asegura que el navegador reconozca bien la ruta permitida
    router.replace("/device-blocked");
  };

  return (
    <YStack
      flex={1}
      backgroundColor={COLORS.background.base}
      paddingHorizontal="$4"
      paddingTop="$8"
      justifyContent="space-between"
    >
      <YStack gap="$6" flex={1}>
        <YStack gap="$2" paddingTop="$4">
          <YStack flexDirection="row" alignItems="center" gap="$3">
            <YStack width={4} height={24} backgroundColor={COLORS.primary.main} borderRadius={2} />
            <Text fontSize={28} fontWeight="800" color="white" letterSpacing={-1}>
              MÉTODOS DE PAGO
            </Text>
          </YStack>
          <Text fontSize={15} color={COLORS.text.secondary} paddingLeft="$5">
            Seleccione su canal preferido
          </Text>
        </YStack>

        <YStack gap="$3" marginTop="$4">
          <YStack
            backgroundColor={COLORS.background.container}
            borderRadius={16}
            padding="$4"
            gap="$3"
            borderWidth={1}
            borderColor={COLORS.background.interactive}
          >
            <YStack flexDirection="row" justifyContent="space-between" alignItems="flex-start">
              <YStack flexDirection="row" gap="$3" alignItems="center" flex={1}>
                <YStack
                  width={48}
                  height={48}
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
              </YStack>
            </YStack>

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
                Av. Central 123,{"\n"}Ciudad Capital
              </Text>
            </YStack>
          </YStack>

          <YStack
            backgroundColor={COLORS.background.container}
            borderRadius={16}
            padding="$4"
            gap="$3"
            borderWidth={1}
            borderColor={COLORS.background.interactive}
          >
            <YStack flexDirection="row" justifyContent="space-between" alignItems="flex-start">
              <YStack flexDirection="row" gap="$3" alignItems="center" flex={1}>
                <YStack
                  width={48}
                  height={48}
                  borderRadius={12}
                  backgroundColor={COLORS.primary.dark}
                  justifyContent="center"
                  alignItems="center"
                >
                  <FontAwesome name="bank" size={22} color={COLORS.primary.main} />
                </YStack>
                <Text fontSize={18} fontWeight="700" color="white">
                  Transferencia Bancaria
                </Text>
              </YStack>
            </YStack>

            <YStack
              gap="$2"
              paddingTop="$2"
              borderTopWidth={1}
              borderTopColor={COLORS.border.subtle}
            >
              <YStack gap="$1.5">
                <Text fontSize={10} color={COLORS.text.tertiary} letterSpacing={1} fontWeight="600">
                  BANCO
                </Text>
                <Text fontSize={14} color={COLORS.text.secondary} fontWeight="600">
                  Crimson Bank
                </Text>
              </YStack>

              <YStack gap="$1.5">
                <Text fontSize={10} color={COLORS.text.tertiary} letterSpacing={1} fontWeight="600">
                  CUENTA
                </Text>
                <Text fontSize={14} color={COLORS.text.secondary} fontWeight="600">
                  0012-3456-7890
                </Text>
              </YStack>

              <YStack gap="$1.5">
                <Text fontSize={10} color={COLORS.text.tertiary} letterSpacing={1} fontWeight="600">
                  CLABE
                </Text>
                <XStack gap="$2" alignItems="center" justifyContent="space-between">
                  <Text fontSize={14} color={COLORS.text.secondary} fontWeight="600" flex={1}>
                    123456789012345678
                  </Text>
                  <Button
                    size="$3"
                    circular
                    backgroundColor={COLORS.primary.main}
                    onPress={() => copyToClipboard("123456789012345678", "CLABE")}
                    icon={<FontAwesome name="copy" size={14} color="white" />}
                  />
                </XStack>
              </YStack>
            </YStack>
          </YStack>
        </YStack>
      </YStack>

      <YStack width="100%" marginBottom="$8" gap="$4">
        <Button
          backgroundColor={COLORS.secondary.main}
          borderRadius={12}
          height={52}
          onPress={handleBack}
          pressStyle={{ opacity: 0.85 }}
        >
          <Text
            color="white"
            fontSize={17}
            fontWeight="800"
            textAlign="center"
            letterSpacing={1}
          >
            VOLVER
          </Text>
        </Button>

        <Text
          fontSize={10}
          color={COLORS.text.muted}
          textAlign="center"
          letterSpacing={0.8}
        >
          PROTOCOLO DE PAGO V3.4
        </Text>
      </YStack>
    </YStack>
  );
}
