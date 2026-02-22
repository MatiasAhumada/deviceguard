import { XStack, YStack, Text, styled } from 'tamagui';

const CodeBox = styled(YStack, {
  width: 44,
  height: 52,
  borderWidth: 2,
  borderColor: '#DC2626',
  borderRadius: 8,
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: 'transparent',
});

interface CodeInputProps {
  code: string[];
}

export function CodeInput({ code }: CodeInputProps) {
  return (
    <XStack gap="$4" marginTop="$6" marginStart="$3">
      {code.map((digit, index) => (
        <CodeBox key={index}>
          <Text fontSize={28} fontWeight="bold" color="white">
            {digit}
          </Text>
        </CodeBox>
      ))}
    </XStack>
  );
}
