import { useEffect } from "react";
import Animated, {
  useAnimatedKeyboard,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export const KeyboardPaddingView =
  process.env.EXPO_OS === "web"
    ? () => null
    : () => {
        const keyboard = useAnimatedKeyboard();
        const { bottom } = useSafeAreaInsets();
        const bottomInset = useSharedValue(0);

        // Update the shared value when bottom changes
        useEffect(() => {
          bottomInset.value = bottom;
        }, [bottom]);

        const animatedHeight = useDerivedValue(() => {
          return Math.max(keyboard.height.value, bottomInset.value);
        });

        const keyboardHeightStyle = useAnimatedStyle(() => {
          return {
            height: animatedHeight.value,
          };
        });
        return <Animated.View style={keyboardHeightStyle} />;
      };
