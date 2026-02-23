import { useEffect } from "react";
import { useRouter } from "expo-router";
import { YStack, Text } from "tamagui";
import { LinkingAnimation } from "@/components/linking/LinkingAnimation";
import { LinkingStatus } from "@/components/linking/LinkingStatus";
import { LinkingSteps } from "@/components/linking/LinkingSteps";

export default function LinkingScreen() {
  const router = useRouter();

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      router.replace("/linking-success");
    }, 10000);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [router]);

  return (
    <YStack flex={1} backgroundColor="#000000" justifyContent="center" alignItems="center" paddingHorizontal="$4">
      <LinkingAnimation />
      
      <YStack gap="$3" alignItems="center" marginTop="$8">
        <Text fontSize={24} fontWeight="600" color="white" textAlign="center">
          Estableciendo conexión segura...
        </Text>
        
        <LinkingSteps />
      </YStack>

      <LinkingStatus />
    </YStack>
  );
}
