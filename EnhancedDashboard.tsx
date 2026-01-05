/**
 * Enhanced Dashboard Component
 * Displays market data with asset type labels and responsive design
 * Mobile-first approach with Tailwind breakpoints
 */

import React, { useState, useEffect } from 'react';
import { View, ScrollView, RefreshControl, Text, Pressable } from 'react-native';
import { Asset, IndicatorSignal } from '../lib/multi-provider-api';
import { getSignalColor, getSignalIcon, formatSignalStrength } from '../lib/indicators-enhanced';

interface DashboardProps {
  assets: Asset[];
  signals: IndicatorSignal[];
  isLoading: boolean;
  onRefresh: () => Promise<void>;
}

/**
 * Asset Type Badge Component
 */
const AssetTypeBadge: React.FC<{ type: 'forex' | 'commodity' | 'crypto' }> = ({ type }) => {
  const badgeConfig = {
    forex: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Forex' },
    commodity: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Commodity' },
    crypto: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Crypto' },
  };

  const config = badgeConfig[type];

  return (
    <View className={`${config.bg} px-2 py-1 rounded-full`}>
      <Text className={`${config.text} text-xs font-semibold`}>{config.label}</Text>
    </View>
  );
};

/**
 * Price Card Component
 */
const PriceCard: React.FC<{ asset: Asset }> = ({ asset }) => {
  const isPositive = asset.change24hPercent >= 0;
  const changeColor = isPositive ? 'text-green-600' : 'text-red-600';
  const changeIcon = isPositive ? '▲' : '▼';

  return (
    <Pressable className="bg-white rounded-lg shadow-md p-4 mb-3 border-l-4 border-blue-500">
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-1">
          <Text className="text-lg font-bold text-gray-900">{asset.symbol}</Text>
          <Text className="text-sm text-gray-600 mt-1">{asset.name}</Text>
        </View>
        <AssetTypeBadge type={asset.type} />
      </View>

      <View className="mt-3 border-t border-gray-200 pt-3">
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-2xl font-bold text-gray-900">${asset.price.toFixed(4)}</Text>
          <View className="flex-row items-center">
            <Text className={`text-lg font-semibold ${changeColor}`}>
              {changeIcon} {Math.abs(asset.change24hPercent).toFixed(2)}%
            </Text>
          </View>
        </View>
        <Text className="text-xs text-gray-500">
          24h Change: ${asset.change24h.toFixed(4)}
        </Text>
        <Text className="text-xs text-gray-400 mt-1">
          Provider: {asset.provider}
        </Text>
      </View>
    </Pressable>
  );
};

/**
 * Indicator Signal Card Component
 */
const SignalCard: React.FC<{ signal: IndicatorSignal }> = ({ signal }) => {
  const signalColor = getSignalColor(signal.signal, signal.strength);
  const signalIcon = getSignalIcon(signal.signal);
  const strengthText = formatSignalStrength(signal.strength);

  const signalBgColor = {
    buy: 'bg-green-50 border-green-200',
    sell: 'bg-red-50 border-red-200',
    neutral: 'bg-amber-50 border-amber-200',
  }[signal.signal];

  const signalTextColor = {
    buy: 'text-green-700',
    sell: 'text-red-700',
    neutral: 'text-amber-700',
  }[signal.signal];

  return (
    <View className={`${signalBgColor} rounded-lg p-3 mb-2 border border-gray-200`}>
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-1">
          <View className="flex-row items-center mb-1">
            <Text className="text-lg mr-2">{signalIcon}</Text>
            <Text className={`text-sm font-bold ${signalTextColor}`}>
              {signal.signal.toUpperCase()}
            </Text>
          </View>
          <Text className="text-xs text-gray-600">{signal.indicatorName}</Text>
        </View>
        <AssetTypeBadge type={signal.assetType} />
      </View>

      <View className="bg-white bg-opacity-50 rounded p-2 mt-2">
        <View className="flex-row justify-between items-center mb-1">
          <Text className="text-xs text-gray-600">Asset:</Text>
          <Text className="text-sm font-semibold text-gray-900">
            {signal.assetSymbol} ({signal.assetName})
          </Text>
        </View>
        <View className="flex-row justify-between items-center mb-1">
          <Text className="text-xs text-gray-600">Strength:</Text>
          <Text className={`text-sm font-semibold ${signalTextColor}`}>
            {strengthText} ({signal.strength.toFixed(0)}%)
          </Text>
        </View>
        <View className="flex-row justify-between items-center">
          <Text className="text-xs text-gray-600">Value:</Text>
          <Text className="text-sm font-mono text-gray-900">
            {signal.value.toFixed(4)}
          </Text>
        </View>
      </View>

      <Text className="text-xs text-gray-400 mt-2">
        Provider: {signal.provider}
      </Text>
    </View>
  );
};

/**
 * Main Dashboard Component
 */
export const EnhancedDashboard: React.FC<DashboardProps> = ({
  assets,
  signals,
  isLoading,
  onRefresh,
}) => {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  };

  // Group signals by asset
  const signalsByAsset = signals.reduce(
    (acc, signal) => {
      if (!acc[signal.assetId]) {
        acc[signal.assetId] = [];
      }
      acc[signal.assetId].push(signal);
      return acc;
    },
    {} as Record<string, IndicatorSignal[]>
  );

  // Group assets by type
  const assetsByType = assets.reduce(
    (acc, asset) => {
      if (!acc[asset.type]) {
        acc[asset.type] = [];
      }
      acc[asset.type].push(asset);
      return acc;
    },
    {} as Record<string, Asset[]>
  );

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Header */}
      <View className="bg-gradient-to-r from-blue-600 to-blue-800 px-4 py-6 md:px-6 md:py-8">
        <Text className="text-white text-2xl md:text-3xl font-bold">Market Dashboard</Text>
        <Text className="text-blue-100 text-sm md:text-base mt-1">
          Real-time prices with technical indicators
        </Text>
      </View>

      {/* Main Content */}
      <View className="px-4 py-4 md:px-6 md:py-6">
        {/* Forex Section */}
        {assetsByType.forex && assetsByType.forex.length > 0 && (
          <View className="mb-6">
            <View className="flex-row items-center mb-3">
              <View className="w-1 h-6 bg-blue-600 rounded mr-2" />
              <Text className="text-lg md:text-xl font-bold text-gray-900">Forex Pairs</Text>
              <View className="ml-2 bg-blue-100 px-2 py-1 rounded">
                <Text className="text-xs font-semibold text-blue-800">
                  {assetsByType.forex.length}
                </Text>
              </View>
            </View>
            {assetsByType.forex.map(asset => (
              <View key={asset.id}>
                <PriceCard asset={asset} />
                {signalsByAsset[asset.id] && (
                  <View className="ml-2 mb-3">
                    <Text className="text-xs font-semibold text-gray-600 mb-2">
                      Signals ({signalsByAsset[asset.id].length})
                    </Text>
                    {signalsByAsset[asset.id].map((signal, idx) => (
                      <SignalCard key={idx} signal={signal} />
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Commodities Section */}
        {assetsByType.commodity && assetsByType.commodity.length > 0 && (
          <View className="mb-6">
            <View className="flex-row items-center mb-3">
              <View className="w-1 h-6 bg-yellow-600 rounded mr-2" />
              <Text className="text-lg md:text-xl font-bold text-gray-900">Commodities</Text>
              <View className="ml-2 bg-yellow-100 px-2 py-1 rounded">
                <Text className="text-xs font-semibold text-yellow-800">
                  {assetsByType.commodity.length}
                </Text>
              </View>
            </View>
            {assetsByType.commodity.map(asset => (
              <View key={asset.id}>
                <PriceCard asset={asset} />
                {signalsByAsset[asset.id] && (
                  <View className="ml-2 mb-3">
                    <Text className="text-xs font-semibold text-gray-600 mb-2">
                      Signals ({signalsByAsset[asset.id].length})
                    </Text>
                    {signalsByAsset[asset.id].map((signal, idx) => (
                      <SignalCard key={idx} signal={signal} />
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Crypto Section */}
        {assetsByType.crypto && assetsByType.crypto.length > 0 && (
          <View className="mb-6">
            <View className="flex-row items-center mb-3">
              <View className="w-1 h-6 bg-purple-600 rounded mr-2" />
              <Text className="text-lg md:text-xl font-bold text-gray-900">Cryptocurrencies</Text>
              <View className="ml-2 bg-purple-100 px-2 py-1 rounded">
                <Text className="text-xs font-semibold text-purple-800">
                  {assetsByType.crypto.length}
                </Text>
              </View>
            </View>
            {assetsByType.crypto.map(asset => (
              <View key={asset.id}>
                <PriceCard asset={asset} />
                {signalsByAsset[asset.id] && (
                  <View className="ml-2 mb-3">
                    <Text className="text-xs font-semibold text-gray-600 mb-2">
                      Signals ({signalsByAsset[asset.id].length})
                    </Text>
                    {signalsByAsset[asset.id].map((signal, idx) => (
                      <SignalCard key={idx} signal={signal} />
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Empty State */}
        {assets.length === 0 && !isLoading && (
          <View className="bg-white rounded-lg p-6 text-center">
            <Text className="text-gray-600 text-base">No market data available</Text>
            <Text className="text-gray-500 text-sm mt-2">
              Pull down to refresh and load latest prices
            </Text>
          </View>
        )}

        {/* Loading State */}
        {isLoading && (
          <View className="bg-white rounded-lg p-6 text-center">
            <Text className="text-gray-600 text-base">Loading market data...</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

export default EnhancedDashboard;
