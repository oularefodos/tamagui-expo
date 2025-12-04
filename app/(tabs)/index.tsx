import { Text, YStack } from "tamagui";

export default function Index() {
    return (
        <YStack
            flex={1}
            backgroundColor="$background"
            alignItems="center"
            justifyContent="center"
            gap="$4"
        >
            <Text fontSize="$8" color="$color">
                Home screen
            </Text>
        </YStack>
    );
}
