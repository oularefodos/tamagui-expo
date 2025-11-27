import { Mic, Volume2 } from "@tamagui/lucide-icons";
import { useState } from "react";
import { Button, H1, Paragraph, Text, YStack } from "tamagui";

export default function MainScreen() {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <YStack f={1} bg="$background">
      {/* Header Section */}
      <YStack f={1} jc="center" ai="center" px="$6" space="$4">
        {/* Logo/Icon */}
        <YStack ai="center" space="$4">
          <H1 size="$10" fontWeight="800" color="$color" ta="center">
            Echo
          </H1>

          <Paragraph size="$5" color="$gray11" ta="center" maxWidth={300}>
            Starter Project
          </Paragraph>
        </YStack>
      </YStack>

      {/* Footer */}
      <YStack p="$4" ai="center">
        <Text color="$gray10" fontSize="$2">
          Built with ♥ using Expo & Tamagui
        </Text>
      </YStack>
    </YStack>
  );
}
