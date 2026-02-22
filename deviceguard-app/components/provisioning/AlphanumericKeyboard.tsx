import { XStack, YStack, Text } from "tamagui";
import { TouchableOpacity, Dimensions } from "react-native";

const { width } = Dimensions.get("window");
const buttonSize = Math.floor((width - 60) / 9);
const buttonHeight = 50;

const ALPHANUMERIC_CHARS = [
  ["A", "B", "C", "D", "E", "F", "G", "H", "I"],
  ["J", "K", "L", "M", "N", "O", "P", "Q", "R"],
  ["S", "T", "U", "V", "W", "X", "Y", "Z"],
];

interface AlphanumericKeyboardProps {
  onInput: (char: string) => void;
  onDelete: () => void;
  onToggleNumbers: () => void;
}

export function AlphanumericKeyboard({ onInput, onDelete, onToggleNumbers }: AlphanumericKeyboardProps) {
  return (
    <YStack paddingVertical="$6" gap="$2" marginTop="auto">
      {ALPHANUMERIC_CHARS.map((row, rowIndex) => (
        <XStack key={rowIndex} justifyContent="space-around" paddingHorizontal="$2" marginBottom="$4">
          {row.map((char) => (
            <TouchableOpacity
              key={char}
              onPress={() => onInput(char)}
              style={{
                width: buttonSize,
                height: buttonHeight,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text fontSize={20} fontWeight="400" color="white">
                {char}
              </Text>
            </TouchableOpacity>
          ))}
        </XStack>
      ))}
      <XStack justifyContent="space-around" paddingHorizontal="$2">
        <TouchableOpacity
          onPress={onToggleNumbers}
          style={{
            width: buttonSize * 2,
            height: buttonHeight,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text fontSize={26} fontWeight="400" color="white">
            123
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {}}
          style={{
            width: buttonSize * 3,
            height: buttonHeight,
            justifyContent: "center",
            alignItems: "center",
          }}
        ></TouchableOpacity>
        <TouchableOpacity
          onPress={onDelete}
          style={{
            width: buttonSize * 2,
            height: buttonHeight,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text fontSize={26} fontWeight="400" color="white">
            ⌫
          </Text>
        </TouchableOpacity>
      </XStack>
    </YStack>
  );
}
