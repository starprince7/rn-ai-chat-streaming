import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  useLLM,
  Message as MessageType,
  LLAMA3_2_1B,
  LLAMA3_2_1B_QLORA,
  LLAMA3_2_1B_SPINQUANT,
  LLAMA3_2_3B,
  LLAMA3_2_3B_QLORA,
  LLAMA3_2_3B_SPINQUANT,
  SMOLLM2_1_135M_QUANTIZED,
  SMOLLM2_1_1_7B_QUANTIZED,
} from "react-native-executorch";
import { KeyboardPaddingView } from "@/components/keyboard-padding";

export default function ChatScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [input, setInput] = useState("");
  const scrollViewRef = useRef<ScrollView>(null);

  // Extract model parameters from navigation
  const modelName = (params.modelName as string) || "LLAMA3 2.1B QLORA";
  const modelConstant = (params.modelConstant as string) || "LLAMA3 2.1B QLORA";
  const modelSpecParam = params.modelSpec as string | undefined;

  // Map model constant names to actual model constants
  const getModelConstant = (constantName: string | undefined) => {
    if (!constantName) return LLAMA3_2_1B_QLORA;
    const modelMap: { [key: string]: any } = {
      "LLAMA3 2.1B": LLAMA3_2_1B,
      "LLAMA3 2.1B QLORA": LLAMA3_2_1B_QLORA,
      "LLAMA3 2.1B SPINQUANT": LLAMA3_2_1B_SPINQUANT,
      "LLAMA3 2.3B": LLAMA3_2_3B,
      "LLAMA3 2.3B QLORA": LLAMA3_2_3B_QLORA,
      "LLAMA3 2.3B SPINQUANT": LLAMA3_2_3B_SPINQUANT,
      "SMOLLM2 1.135M QUANTIZED": SMOLLM2_1_135M_QUANTIZED,
      "SMOLLM2 1.1 7B QUANTIZED": SMOLLM2_1_1_7B_QUANTIZED,
    };
    return modelMap[constantName] || LLAMA3_2_1B_QLORA;
  };

  let selectedModel: any = getModelConstant(modelConstant);
  if (modelSpecParam) {
    try {
      const parsed = JSON.parse(decodeURIComponent(modelSpecParam));
      if (parsed && typeof parsed === "object") {
        if (!parsed.modelSource || !parsed.tokenizerSource) {
          throw new Error("Invalid model spec: missing model/tokenizer source");
        }
        // Ensure URLs are strings
        if (
          typeof parsed.modelSource !== "string" ||
          typeof parsed.tokenizerSource !== "string"
        ) {
          throw new Error("Model URLs must be strings");
        }
        selectedModel = parsed;
      }
    } catch (e) {
      console.error("Error parsing model spec:", e);
    }
  }

  // Final validation
  if (
    !selectedModel ||
    !selectedModel.modelSource ||
    !selectedModel.tokenizerSource
  ) {
    console.error("Invalid model configuration, using default");
    selectedModel = LLAMA3_2_1B_QLORA;
  }

  const llm = useLLM({
    model: selectedModel,
  });

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
  } = llm;

  useEffect(() => {
    llm.configure({
      chatConfig: {
        systemPrompt: `
You are a helpful and intelligent female assistant named Amarachukwu Precious. 
You provide accurate, thoughtful, and clear answers to every question. 
You do not have access to the internet, so you rely only on your internal knowledge and reasoning. 
If you are unsure about something, you clearly state that instead of guessing. 
Always communicate in a warm, respectful, and confident tone.
Current date and time: ${new Date().toString()}.
`,
      },
    });
  }, []);

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messageHistory]);

  const handleInputChange = useCallback((text: string) => {
    setInput(text);
  }, []);

  const handleSubmit = useCallback(
    (e: any) => {
      if (!input.trim()) {
        return;
      }

      if (!isReady) {
        Alert.alert(
          "Model Not Ready",
          "The model is still loading. Please wait and try again.",
          [{ text: "OK" }]
        );
        return;
      }

      try {
        sendMessage(input.trim());
        setInput("");
      } catch (error) {
        console.error("Error sending message:", error);
        Alert.alert("Error", "Failed to send message. Please try again.", [
          { text: "OK" },
        ]);
      }
    },
    [input, isReady, sendMessage]
  );

  if (error) {
    const errorMessage =
      typeof error === "string"
        ? error
        : (error as any)?.message || String(error) || "An error occurred";
    return (
      <View
        style={{ flex: 1, paddingTop: insets.top }}
        className="items-center justify-center p-4"
      >
        <Text className="text-red-500 text-center mb-4">{errorMessage}</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="px-4 py-2 bg-blue-500 rounded-lg"
        >
          <Text className="text-white font-medium">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Show download progress if model is not ready
  if (!isReady) {
    return (
      <View
        style={{ flex: 1, paddingTop: insets.top }}
        className="items-center justify-center p-4 bg-white/50"
      >
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
            Loading {modelName}...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View
      style={{
        flex: 1,
        paddingTop: Platform.OS === "android" ? insets.top : 0,
      }}
    >
      {/* Header */}
      <View className="px-6 py-4 border-b border-gray-200 bg-white">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => router.back()}
            className="px-3 py-2 rounded-lg bg-gray-100"
          >
            <Text className="text-gray-700 font-medium">← Back</Text>
          </TouchableOpacity>
          <Text className="text-lg font-semibold text-gray-900 flex-1 text-center mr-12">
            {modelName}
          </Text>
        </View>
      </View>

      {/* Chat Messages */}
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
          <Message
            key={`${m.role}-${index}-${m.content.substring(0, 20)}`}
            message={m}
          />
        ))}
        {isGenerating && <TypingEffect />}

        {/* Spacer so last message is visible above the input */}
        <KeyboardPaddingView />
      </ScrollView>

      {/* Input Area */}
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
              onChangeText={handleInputChange}
              onSubmitEditing={(e) => {
                handleSubmit(e);
                e.preventDefault();
              }}
              autoFocus
            />
            <View className="pr-4">
              {isGenerating ? (
                <TouchableOpacity
                  onPress={interrupt}
                  className="w-auto h-auto bg-red-500 rounded-lg py-2 px-4"
                >
                  <Text className="text-sm text-white font-semibold text-center">
                    Stop
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  disabled={!input.trim()}
                  onPress={handleSubmit}
                  className="w-auto h-auto bg-amber-500 rounded-lg py-2 px-4 disabled:bg-gray-100"
                >
                  <Text className="text-sm font-semibold text-center">
                    Submit
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        <KeyboardPaddingView />
      </View>
    </View>
  );
}

// Memoized components to prevent unnecessary re-renders
const Message = React.memo(({ message }: { message: MessageType }) => {
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
});
Message.displayName = "Message";

const TypingEffect = React.memo(() => {
  const [dots, setDots] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => {
        if (prev === "...") return "";
        return prev + ".";
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <View className="flex-row justify-start mb-4">
      <View className="max-w-[80%] px-4 py-3 rounded-2xl bg-gray-200 rounded-bl-md">
        <Text className="text-base text-gray-800">Typing{dots}</Text>
      </View>
    </View>
  );
});
TypingEffect.displayName = "TypingEffect";
