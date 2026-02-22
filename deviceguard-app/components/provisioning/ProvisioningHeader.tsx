import { YStack, Text } from 'tamagui';
import { BrandLogo } from './BrandLogo';

export function ProvisioningHeader() {
  return (
    <YStack alignItems="center" gap="$4">
      <BrandLogo />

      <YStack gap="$2" alignItems="center" marginTop="$2">
        <Text fontSize={30} fontWeight="bold" color="white" textAlign="center">
          Vincular Dispositivo
        </Text>
        <Text fontSize={20} color="#9CA3AF" textAlign="center" maxWidth={400} lineHeight={20}>
          Ingrese el código de 6 dígitos generado en su panel de administración para comenzar la protección
        </Text>
      </YStack>
    </YStack>
  );
}
