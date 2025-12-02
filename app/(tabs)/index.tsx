import { Button, Text, YStack } from "tamagui";

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
            <Button
                borderWidth={1}
                borderColor="$borderColor"
                backgroundColor="transparent"
                borderRadius="$4"
            >
                Hello
            </Button>
        </YStack>
    );
}
