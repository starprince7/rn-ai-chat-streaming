import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Import all available models from react-native-executorch
import {
  LLAMA3_2_1B,
  LLAMA3_2_1B_QLORA,
  LLAMA3_2_1B_SPINQUANT,
  LLAMA3_2_3B,
  LLAMA3_2_3B_QLORA,
  LLAMA3_2_3B_SPINQUANT,
  SMOLLM2_1_135M_QUANTIZED,
  SMOLLM2_1_1_7B_QUANTIZED
} from "react-native-executorch";

interface ModelInfo {
  name: string;
  model: any; // The exported model constant
  size: string;
  ramNeeded: string;
  lowEndDevice: boolean;
  specialFeatures: string;
  recommended?: boolean;
}

interface DownloadedModel extends ModelInfo {
  isDownloaded: boolean;
}

const AVAILABLE_MODELS: ModelInfo[] = [
  {
    name: "SMOLLM2 1.135M QUANTIZED",
    model: SMOLLM2_1_135M_QUANTIZED,
    size: "~135MB",
    ramNeeded: "Not Tested",
    lowEndDevice: true,
    specialFeatures: "Lightweight, quantized",
  },
  {
    name: "SMOLLM2 1.1 7B QUANTIZED",
    model: SMOLLM2_1_1_7B_QUANTIZED,
    size: "~700MB",
    ramNeeded: "Not Tested",
    lowEndDevice: true,
    specialFeatures: "Quantized",
  },
  {
    name: "LLAMA3 2.1B",
    model: LLAMA3_2_1B,
    size: "~2.5GB",
    ramNeeded: "3.2GB",
    lowEndDevice: false,
    specialFeatures: "High quality, standard model",
  },
  {
    name: "LLAMA3 2.1B QLORA",
    model: LLAMA3_2_1B_QLORA,
    size: "~1.2GB",
    ramNeeded: "2.2GB",
    lowEndDevice: true,
    specialFeatures: "RECOMMENDED - Best balance",
    recommended: true,
  },
  {
    name: "LLAMA3 2.1B SPINQUANT",
    model: LLAMA3_2_1B_SPINQUANT,
    size: "~1.1GB",
    ramNeeded: "1.9GB",
    lowEndDevice: true,
    specialFeatures: "Fastest inference, quantized",
  },
  {
    name: "LLAMA3 2.3B",
    model: LLAMA3_2_3B,
    size: "~6.4GB",
    ramNeeded: "7.1GB",
    lowEndDevice: false,
    specialFeatures: "Highest quality, requires high-end device",
  },
  {
    name: "LLAMA3 2.3B QLORA",
    model: LLAMA3_2_3B_QLORA,
    size: "~2.7GB",
    ramNeeded: "4.0GB",
    lowEndDevice: false,
    specialFeatures: "High quality, quantized",
  },
  {
    name: "LLAMA3 2.3B SPINQUANT",
    model: LLAMA3_2_3B_SPINQUANT,
    size: "~2.6GB",
    ramNeeded: "3.7GB",
    lowEndDevice: false,
    specialFeatures: "High quality, fastest 3B model",
  },
];

const STORAGE_KEY = "downloaded_models";

export function ModelsList() {
  const [models, setModels] = useState<DownloadedModel[]>([]);
  const insets = useSafeAreaInsets();
  const router = useRouter();

  useEffect(() => {
    loadDownloadedModels();
  }, []);

  const loadDownloadedModels = async () => {
    try {
      const downloadedModelsData = await AsyncStorage.getItem(STORAGE_KEY);
      const downloadedModels = downloadedModelsData
        ? JSON.parse(downloadedModelsData)
        : {};

      const modelsWithStatus = AVAILABLE_MODELS.map((model) => ({
        ...model,
        isDownloaded: downloadedModels[model.name] || false,
      }));

      setModels(modelsWithStatus);
    } catch (error) {
      console.error("Error loading downloaded models:", error);
    }
  };

  const saveDownloadedModel = async (modelName: string) => {
    try {
      const downloadedModelsData = await AsyncStorage.getItem(STORAGE_KEY);
      const downloadedModels = downloadedModelsData
        ? JSON.parse(downloadedModelsData)
        : {};
      downloadedModels[modelName] = true;
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(downloadedModels));
    } catch (error) {
      console.error("Error saving downloaded model:", error);
    }
  };

  const handleDownload = async (model: DownloadedModel) => {
    if (model.isDownloaded) {
      Alert.alert(
        "Model Already Available",
        "This model has already been made available and is ready to use.",
        [{ text: "OK" }]
      );
      return;
    }

    try {
      // Mark model as downloaded - the actual download will happen when useLLM is initialized
      await saveDownloadedModel(model.name);

      setModels((prev) =>
        prev.map((m) =>
          m.name === model.name ? { ...m, isDownloaded: true } : m
        )
      );

      Alert.alert(
        "Model Ready",
        `${model.name} is now available for chat. The model will be downloaded automatically when you start chatting.`,
        [{ text: "OK" }]
      );
    } catch (error) {
      console.error("Error marking model as downloaded:", error);
      Alert.alert(
        "Error",
        "Failed to mark model as available. Please try again.",
        [{ text: "OK" }]
      );
    }
  };

  const handleModelSelect = (model: DownloadedModel) => {
    if (!model.isDownloaded) {
      Alert.alert(
        "Model Not Available",
        "Please make the model available first before using it.",
        [{ text: "OK" }]
      );
      return;
    }

    router.push({
      pathname: "/chat",
      params: {
        modelName: model.name,
        modelConstant: model.name,
        modelSpec: encodeURIComponent(JSON.stringify(model.model)),
      },
    });
  };

  const getDeviceCompatibilityColor = (lowEndDevice: boolean) => {
    return lowEndDevice ? "text-green-600" : "text-orange-600";
  };

  const getDeviceCompatibilityIcon = (lowEndDevice: boolean) => {
    return lowEndDevice ? "✅" : "⚠️";
  };

  return (
    <View style={{ flex: 1, paddingTop: insets.top }} className="bg-white">
      <View className="px-6 py-4 border-b border-gray-200">
        <Text className="text-2xl font-bold text-gray-900">AI Models</Text>
        <Text className="text-gray-600 mt-1">
          Choose from optimized models for on-device AI
        </Text>
      </View>

      <ScrollView className="flex-1 px-6 py-4">
        {models.map((model, index) => (
          <View
            key={index}
            className={`bg-white border rounded-xl p-4 mb-4 shadow-sm ${
              model.recommended
                ? "border-blue-300 bg-blue-50"
                : "border-gray-200"
            }`}
          >
            {model.recommended && (
              <View className="mb-2">
                <Text className="text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-1 rounded-full self-start">
                  RECOMMENDED
                </Text>
              </View>
            )}

            <View className="flex-row items-center justify-between">
              <View className="flex-1 mr-4">
                <Text className="text-lg font-semibold text-gray-900 mb-1">
                  {model.name}
                </Text>

                {/* Model specifications in a compact format */}
                <View className="flex-row flex-wrap gap-2 mb-2">
                  <View className="bg-gray-100 px-2 py-1 rounded-md">
                    <Text className="text-xs text-gray-600">
                      📦 {model.size}
                    </Text>
                  </View>
                  <View className="bg-gray-100 px-2 py-1 rounded-md">
                    <Text className="text-xs text-gray-600">
                      💾 {model.ramNeeded} RAM
                    </Text>
                  </View>
                  <View
                    className={`px-2 py-1 rounded-md ${
                      model.lowEndDevice ? "bg-green-100" : "bg-orange-100"
                    }`}
                  >
                    <Text
                      className={`text-xs ${
                        model.lowEndDevice
                          ? "text-green-700"
                          : "text-orange-700"
                      }`}
                    >
                      {getDeviceCompatibilityIcon(model.lowEndDevice)}{" "}
                      {model.lowEndDevice ? "Low-end OK" : "Mid-range+"}
                    </Text>
                  </View>
                </View>

                <Text className="text-sm text-gray-600 mb-1">
                  {model.specialFeatures}
                </Text>

                <Text className="text-sm text-gray-500">
                  {model.isDownloaded ? "Available for chat" : "Not available"}
                </Text>
              </View>

              <View className="flex-row items-center space-x-2">
                <TouchableOpacity
                  onPress={() => handleDownload(model)}
                  className={`px-4 py-2 rounded-lg ${
                    model.isDownloaded
                      ? "bg-green-100 border border-green-300"
                      : "bg-blue-500"
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${
                      model.isDownloaded ? "text-green-700" : "text-white"
                    }`}
                  >
                    {model.isDownloaded ? "Available" : "Make Available"}
                  </Text>
                </TouchableOpacity>

                {model.isDownloaded && (
                  <TouchableOpacity
                    onPress={() => handleModelSelect(model)}
                    className="px-4 py-2 bg-blue-500 rounded-lg"
                  >
                    <Text className="text-sm font-medium text-white">Chat</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
