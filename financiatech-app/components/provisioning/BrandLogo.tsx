import { YStack, Text } from 'tamagui';
import { COLORS } from '@/src/constants/theme.constant';

export function BrandLogo() {
  return (
    <YStack
      width={80}
      height={80}
      backgroundColor={COLORS.primary.main}
      borderRadius={16}
      justifyContent="center"
      alignItems="center"
      transform={[{ rotate: '45deg' }]}
    >
      <Text
        fontSize={36}
        fontWeight="bold"
        color="white"
        transform={[{ rotate: '-45deg' }]}
      >
        FT
      </Text>
    </YStack>
  );
}
