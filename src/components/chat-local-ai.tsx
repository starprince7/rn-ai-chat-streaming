import {
  useLLM,
  LLAMA3_2_1B,
  Message as MessageType,
} from "react-native-executorch";
import { Fragment, useEffect, useRef, useState } from "react";
import {
  ScrollView,
  Text,
  TextInput,
  View,
  ActivityIndicator,
  Animated,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { KeyboardPaddingView } from "@/components/keyboard-padding";
import { CelsiusConvertCard, WeatherCard } from "@/components/tool-cards";
import { UserMessage } from "@/components/user-message";
import { Stack } from "expo-router";

export function ChatWithLocalLLM() {
  const {
    downloadProgress,
    error,
    interrupt,
    sendMessage,
    isReady,
    generate,
    response,
    isGenerating,
    messageHistory,
  } = useLLM({
    model: LLAMA3_2_1B,
    // model: {
    //   modelSource: "",
    //   tokenizerConfigSource: "",
    //   tokenizerSource: "",
    // }
  });

  const [input, setInput] = useState("");
  const scrollViewRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messageHistory]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = (e: any) => {
    const SYSTEM_PROMPT = `
You are a helpful and concise AI assistant.
- Respond clearly and directly to the user's questions.
- Use simple language and short sentences.
- If the user asks for explanations, give practical examples when possible.
- If you are unsure, say so instead of guessing.
- Always stay polite, neutral, and factual.
`;
    if (input.trim() && isReady) {
      // generate([
      //   { role: "system", content: SYSTEM_PROMPT },
      //   { role: "user", content: input },
      // ]);
      sendMessage(input.trim())
      setInput("");
    }
  };

  if (error) {
    const errorMessage =
      typeof error === "string"
        ? error
        : (error as any)?.message || String(error) || "An error occurred";
    return (
      <View style={{ flex: 1, paddingTop: insets.top }} className="items-center justify-center p-4">
        <Text className="text-red-500 text-center">{errorMessage}</Text>
      </View>
    );
  }

  // Show download progress if model is not ready
  if (!isReady) {
    return (
      <View style={{ flex: 1, paddingTop: insets.top }} className="items-center justify-center p-4 bg-white/50">
        <View className="items-center space-y-4">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="text-lg font-semibold text-gray-800">
            {downloadProgress > 0
              ? "Downloading Model..."
              : "Preparing Model..."}
          </Text>
          {downloadProgress > 0 && (
            <View className="w-64">
              <View className="bg-gray-200 rounded-full h-2">
                <View
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${downloadProgress * 100}%` }}
                />
              </View>
              <Text className="text-center text-sm text-gray-600 mt-2">
                {Math.round(downloadProgress * 100)}% complete
              </Text>
            </View>
          )}
          <Text className="text-sm text-gray-500 text-center max-w-xs">
            This may take a few minutes on first launch. The model will be
            cached for future use.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      <ScrollView
        ref={scrollViewRef}
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
        automaticallyAdjustContentInsets
        contentInsetAdjustmentBehavior="automatic"
        contentContainerClassName="gap-4 p-4 pb-8"
        className="flex-1 bg-white/50"
      >
        {messageHistory.map((m, index) => (
          <Message key={index} message={m} />
        ))}
        {isGenerating && <TypingEffect  />}

        {/* Spacer so last message is visible above the input */}
        <KeyboardPaddingView />
      </ScrollView>

      <View
        className="position absolute bottom-0 left-0 right-0"
        style={{
          paddingBottom: insets.bottom,
          [process.env.EXPO_OS === "web"
            ? `backgroundImage`
            : `experimental_backgroundImage`]: `linear-gradient(to bottom, #F2F2F200, #F2F2F2)`,
        }}
      >
        <View
          className="bg-white web:drop-shadow-xl overflow-visible rounded-xl m-3"
          style={{
            boxShadow: "0px 5px 13px rgba(0, 0, 0, 0.1)",
          }}
        >
          <View className="flex-row items-center">
            <TextInput
              className="flex-1 p-4 outline-none"
              style={{ fontSize: 16 }}
              placeholder="Ask me anything..."
              value={input}
              placeholderTextColor={"#A0AEC0"}
              onChange={(e) =>
                handleInputChange({
                  ...e,
                  target: {
                    ...e.target,
                    value: e.nativeEvent.text,
                  },
                } as unknown as React.ChangeEvent<HTMLInputElement>)
              }
              onSubmitEditing={(e) => {
                handleSubmit(e);
                e.preventDefault();
              }}
              autoFocus
            />
            <View className="pr-4">
              <TouchableOpacity onPress={handleSubmit} className="w-2 h-2 bg-amber-500 rounded-full">
                <Text>Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <KeyboardPaddingView />
      </View>
    </View>
  );
}

function Message({ message }: { message: MessageType }) {
  const isUser = message.role === "user";

  return (
    <View
      className={`flex-row ${isUser ? "justify-end" : "justify-start"} mb-4`}
    >
      <View
        className={`max-w-[80%] px-4 py-3 rounded-2xl ${
          isUser ? "bg-blue-500 rounded-br-md" : "bg-gray-200 rounded-bl-md"
        }`}
      >
        <Text
          className={`text-base ${isUser ? "text-white" : "text-gray-800"}`}
        >
          {message.content}
        </Text>
      </View>
    </View>
  );
}

function TypingEffect() {
  const dot1Opacity = useRef(new Animated.Value(0.3)).current;
  const dot2Opacity = useRef(new Animated.Value(0.3)).current;
  const dot3Opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animateDots = () => {
      const createDotAnimation = (dotOpacity: Animated.Value, delay: number) => {
        return Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(dotOpacity, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(dotOpacity, {
              toValue: 0.3,
              duration: 300,
              useNativeDriver: true,
            }),
          ])
        );
      };

      const animation1 = createDotAnimation(dot1Opacity, 0);
      const animation2 = createDotAnimation(dot2Opacity, 200);
      const animation3 = createDotAnimation(dot3Opacity, 400);

      Animated.parallel([animation1, animation2, animation3]).start();
    };

    animateDots();
  }, [dot1Opacity, dot2Opacity, dot3Opacity]);

  return (
    <View className="flex-row justify-start mb-4">
      <View className="max-w-[80%] px-4 py-3 rounded-2xl bg-gray-200 rounded-bl-md">
        <View className="flex-row items-center space-x-1">
          <Animated.Text
            className="text-base text-gray-800"
            style={{ opacity: dot1Opacity }}
          >
            •
          </Animated.Text>
          <Animated.Text
            className="text-base text-gray-800"
            style={{ opacity: dot2Opacity }}
          >
            •
          </Animated.Text>
          <Animated.Text
            className="text-base text-gray-800"
            style={{ opacity: dot3Opacity }}
          >
            •
          </Animated.Text>
        </View>
      </View>
    </View>
  );
}
