import { useState, useEffect, useCallback } from "react";
import { ScrollView, Text, View, TouchableOpacity, RefreshControl, TextInput, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { fetchAllMarketData } from "@/lib/multi-provider-api";
import type { Asset } from "@/types";

export default function MarketsScreen() {
  const colors = useColors();
  const router = useRouter();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const loadMarketData = useCallback(async () => {
    try {
      const data = await fetchAllMarketData();
      setAssets(data);
      setFilteredAssets(data);
    } catch (error) {
      console.error("Error loading market data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadMarketData();
  }, [loadMarketData]);

  useEffect(() => {
    let filtered = assets;

    if (selectedCategory !== "all") {
      filtered = filtered.filter(asset => asset.type === selectedCategory);
    }

    if (searchQuery) {
      filtered = filtered.filter(
        asset =>
          asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          asset.symbol.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredAssets(filtered);
  }, [assets, selectedCategory, searchQuery]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadMarketData();
  }, [loadMarketData]);

  const categories: { id: string; label: string }[] = [
    { id: "all", label: "All" },
    { id: "forex", label: "Forex" },
    { id: "commodity", label: "Commodities" },
    { id: "crypto", label: "Crypto" },
  ];

  const getAssetTypeBadgeColor = (type: string) => {
    switch (type) {
      case "forex":
        return { bg: "#dbeafe", text: "#1e40af" };
      case "commodity":
        return { bg: "#fef3c7", text: "#92400e" };
      case "crypto":
        return { bg: "#e9d5ff", text: "#6b21a8" };
      default:
        return { bg: "#f3f4f6", text: "#374151" };
    }
  };

  return (
    <ScreenContainer>
      <ScrollView
        className="flex-1 bg-gray-50 md:bg-white"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View className="p-4 gap-4 md:p-6">
          {/* Header */}
          <View className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-4 md:p-6 mb-2">
            <Text className="text-white text-2xl md:text-3xl font-bold">Market Dashboard</Text>
            <Text className="text-blue-100 text-sm md:text-base mt-1">Real-time prices with technical indicators</Text>
          </View>

          {/* Search Bar */}
          <View
            className="flex-row items-center px-4 py-3 rounded-xl border"
            style={{ backgroundColor: colors.surface, borderColor: colors.border }}
          >
            <TextInput
              className="flex-1 text-base text-foreground"
              placeholder="Search assets..."
              placeholderTextColor={colors.muted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Category Filters */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
            {categories.map(category => (
              <TouchableOpacity
                key={category.id}
                onPress={() => setSelectedCategory(category.id)}
                className="px-4 py-2 rounded-full"
                style={{
                  backgroundColor: selectedCategory === category.id ? colors.primary : colors.surface,
                }}
              >
                <Text
                  className="text-sm font-semibold"
                  style={{
                    color: selectedCategory === category.id ? colors.background : colors.foreground,
                  }}
                >
                  {category.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Loading State */}
          {loading && (
            <View className="items-center justify-center py-12">
              <ActivityIndicator size="large" color={colors.primary} />
              <Text className="text-muted mt-4">Loading market data...</Text>
            </View>
          )}

          {/* Asset Cards with Type Badges */}
          {!loading && (
            <View className="gap-3">
              {filteredAssets.length === 0 ? (
                <View className="items-center justify-center py-12 bg-white rounded-lg">
                  <Text className="text-muted text-center">No assets found</Text>
                </View>
              ) : (
                filteredAssets.map(asset => {
                  const badgeColor = getAssetTypeBadgeColor(asset.type);
                  const isPositive = asset.change24hPercent >= 0;

                  return (
                    <TouchableOpacity
                      key={asset.id}
                      onPress={() => router.push(`/asset/${asset.id}` as any)}
                      className="p-4 rounded-2xl border md:p-5"
                      style={{
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                      }}
                    >
                      {/* Top Row: Symbol, Price, Badge */}
                      <View className="flex-row items-start justify-between mb-3">
                        <View className="flex-1">
                          <View className="flex-row items-center gap-2 mb-1">
                            <Text className="text-lg font-bold text-foreground">{asset.symbol}</Text>
                            <View
                              className="px-2 py-1 rounded-full"
                              style={{ backgroundColor: badgeColor.bg }}
                            >
                              <Text
                                className="text-xs font-semibold"
                                style={{ color: badgeColor.text }}
                              >
                                {asset.type.charAt(0).toUpperCase() + asset.type.slice(1)}
                              </Text>
                            </View>
                          </View>
                          <Text className="text-sm text-muted">{asset.name}</Text>
                        </View>

                        {/* Price and Change */}
                        <View className="items-end">
                          <Text className="text-lg font-semibold text-foreground">
                            ${asset.price.toFixed(asset.type === 'crypto' ? 2 : 4)}
                          </Text>
                          <View
                            className="px-2 py-1 rounded-md mt-1"
                            style={{
                              backgroundColor: isPositive ? colors.success + '20' : colors.error + '20',
                            }}
                          >
                            <Text
                              className="text-xs font-semibold"
                              style={{
                                color: isPositive ? colors.success : colors.error,
                              }}
                            >
                              {isPositive ? '▲' : '▼'} {Math.abs(asset.change24hPercent).toFixed(2)}%
                            </Text>
                          </View>
                        </View>
                      </View>

                      {/* Provider Info */}
                      <View className="border-t" style={{ borderColor: colors.border }}>
                        <Text className="text-xs text-muted mt-2">
                          Provider: {asset.provider} | Updated: {new Date(asset.lastUpdated).toLocaleTimeString()}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          )}

          {/* Empty State for No Results */}
          {!loading && filteredAssets.length === 0 && assets.length > 0 && (
            <View className="items-center justify-center py-8 bg-white rounded-lg">
              <Text className="text-muted text-center">No assets match your search</Text>
              <TouchableOpacity
                onPress={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                }}
                className="mt-4 px-4 py-2 bg-blue-600 rounded-lg"
              >
                <Text className="text-white font-semibold">Clear Filters</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
