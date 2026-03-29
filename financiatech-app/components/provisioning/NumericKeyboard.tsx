import { XStack, YStack, Text } from 'tamagui';
import { TouchableOpacity } from 'react-native';

const KEYBOARD_LAYOUT = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['ABC', '0', 'DEL'],
];

interface NumericKeyboardProps {
  onInput: (char: string) => void;
  onDelete: () => void;
  onToggleLetters: () => void;
}

export function NumericKeyboard({ onInput, onDelete, onToggleLetters }: NumericKeyboardProps) {
  return (
    <YStack paddingVertical="$6" gap="$2" marginTop="auto">
      {KEYBOARD_LAYOUT.map((row, rowIndex) => (
        <XStack key={rowIndex} justifyContent="space-around">
          {row.map((key) => {
            if (key === 'DEL') {
              return (
                <TouchableOpacity
                  key={key}
                  onPress={onDelete}
                  style={{
                    width: 70,
                    height: 70,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Text fontSize={26} fontWeight="400" color="white">
                    ⌫
                  </Text>
                </TouchableOpacity>
              );
            }
            if (key === 'ABC') {
              return (
                <TouchableOpacity
                  key={key}
                  onPress={onToggleLetters}
                  style={{
                    width: 70,
                    height: 70,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Text fontSize={26} fontWeight="400" color="white">
                    ABC
                  </Text>
                </TouchableOpacity>
              );
            }
            return (
              <TouchableOpacity
                key={key}
                onPress={() => onInput(key)}
                style={{
                  width: 70,
                  height: 70,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Text fontSize={28} fontWeight="400" color="white">
                  {key}
                </Text>
              </TouchableOpacity>
            );
          })}
        </XStack>
      ))}
    </YStack>
  );
}
