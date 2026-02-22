import { YStack, Text } from 'tamagui';

export function BrandLogo() {
  return (
    <YStack
      width={80}
      height={80}
      backgroundColor="#DC2626"
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
        DG
      </Text>
    </YStack>
  );
}
