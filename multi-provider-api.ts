/**
 * Multi-Provider Financial Data API Service
 * Integrates multiple providers with automatic fallback mechanism
 * Supports: Alpha Vantage, Twelve Data, Exchange Rate API, Metal Price API, CoinGecko
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// API Configuration
const API_CONFIG = {
  ALPHA_VANTAGE: {
    baseUrl: 'https://www.alphavantage.co/query',
    key: process.env.ALPHA_VANTAGE_KEY || 'demo',
    rateLimit: 25, // calls per day
    priority: 1,
  },
  TWELVE_DATA: {
    baseUrl: 'https://api.twelvedata.com',
    key: process.env.TWELVE_DATA_KEY,
    rateLimit: 800, // calls per day
    priority: 2,
  },
  EXCHANGE_RATE: {
    baseUrl: 'https://api.exchangerate-api.com/v4/latest',
    key: process.env.EXCHANGE_RATE_KEY,
    rateLimit: 1500, // calls per month
    priority: 3,
  },
  METAL_PRICE: {
    baseUrl: 'https://api.metals.live/v1/spot',
    key: process.env.METAL_PRICE_API_KEY,
    rateLimit: 100, // calls per day
    priority: 4,
  },
  COINGECKO: {
    baseUrl: 'https://api.coingecko.com/api/v3',
    key: '', // No key required
    rateLimit: 10, // calls per second
    priority: 5,
  },
};

const CACHE_DURATION = 60000; // 60 seconds
const PROVIDER_HEALTH_CACHE = 'provider_health';
const API_CALL_LOG = 'api_call_log';

// ============================================
// TYPES & INTERFACES
// ============================================

export interface Asset {
  id: string;
  symbol: string;
  name: string;
  type: 'forex' | 'commodity' | 'crypto';
  price: number;
  change24h: number;
  change24hPercent: number;
  lastUpdated: number;
  provider: string; // Which provider supplied this data
  sparkline?: number[];
}

export interface HistoricalData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface ProviderHealth {
  provider: string;
  isHealthy: boolean;
  lastChecked: number;
  failureCount: number;
  successCount: number;
}

export interface IndicatorSignal {
  assetId: string;
  assetSymbol: string;
  assetType: 'forex' | 'commodity' | 'crypto';
  assetName: string;
  indicatorName: string;
  signal: 'buy' | 'sell' | 'neutral';
  strength: number; // 0-100
  value: number;
  timestamp: number;
  provider: string;
}

// ============================================
// PROVIDER HEALTH MANAGEMENT
// ============================================

async function getProviderHealth(provider: string): Promise<ProviderHealth> {
  try {
    const cached = await AsyncStorage.getItem(`${PROVIDER_HEALTH_CACHE}_${provider}`);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (error) {
    console.error(`Error reading provider health for ${provider}:`, error);
  }

  return {
    provider,
    isHealthy: true,
    lastChecked: Date.now(),
    failureCount: 0,
    successCount: 0,
  };
}

async function updateProviderHealth(
  provider: string,
  success: boolean
): Promise<void> {
  try {
    const health = await getProviderHealth(provider);
    health.lastChecked = Date.now();

    if (success) {
      health.successCount++;
      health.failureCount = Math.max(0, health.failureCount - 1);
      health.isHealthy = true;
    } else {
      health.failureCount++;
      health.isHealthy = health.failureCount < 3; // Mark unhealthy after 3 failures
    }

    await AsyncStorage.setItem(
      `${PROVIDER_HEALTH_CACHE}_${provider}`,
      JSON.stringify(health)
    );
  } catch (error) {
    console.error(`Error updating provider health for ${provider}:`, error);
  }
}

async function getHealthyProviders(): Promise<string[]> {
  const providers = Object.keys(API_CONFIG);
  const healthyProviders: string[] = [];

  for (const provider of providers) {
    const health = await getProviderHealth(provider);
    if (health.isHealthy) {
      healthyProviders.push(provider);
    }
  }

  // Sort by priority
  healthyProviders.sort((a, b) => {
    const configA = API_CONFIG[a as keyof typeof API_CONFIG];
    const configB = API_CONFIG[b as keyof typeof API_CONFIG];
    return (configA?.priority || 999) - (configB?.priority || 999);
  });

  return healthyProviders;
}

// ============================================
// CACHE MANAGEMENT
// ============================================

async function getCachedData(key: string): Promise<any | null> {
  try {
    const cached = await AsyncStorage.getItem(key);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_DURATION) {
        return data;
      }
    }
  } catch (error) {
    console.error('Cache read error:', error);
  }
  return null;
}

async function setCachedData(key: string, data: any): Promise<void> {
  try {
    await AsyncStorage.setItem(
      key,
      JSON.stringify({ data, timestamp: Date.now() })
    );
  } catch (error) {
    console.error('Cache write error:', error);
  }
}

// ============================================
// ALPHA VANTAGE API
// ============================================

async function fetchFromAlphaVantage(
  functionName: string,
  params: Record<string, string>
): Promise<any> {
  const queryParams = new URLSearchParams({
    function: functionName,
    apikey: API_CONFIG.ALPHA_VANTAGE.key,
    ...params,
  });

  const url = `${API_CONFIG.ALPHA_VANTAGE.baseUrl}?${queryParams}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Alpha Vantage API error: ${response.statusText}`);
  }

  const data = await response.json();

  // Check for rate limit or error messages
  if (data['Note'] || data['Error Message']) {
    throw new Error(data['Note'] || data['Error Message']);
  }

  return data;
}

// ============================================
// TWELVE DATA API
// ============================================

async function fetchFromTwelveData(
  endpoint: string,
  params: Record<string, string>
): Promise<any> {
  const queryParams = new URLSearchParams({
    apikey: API_CONFIG.TWELVE_DATA.key || '',
    ...params,
  });

  const url = `${API_CONFIG.TWELVE_DATA.baseUrl}${endpoint}?${queryParams}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Twelve Data API error: ${response.statusText}`);
  }

  return response.json();
}

// ============================================
// EXCHANGE RATE API
// ============================================

async function fetchFromExchangeRateAPI(baseCurrency: string): Promise<any> {
  const url = `${API_CONFIG.EXCHANGE_RATE.baseUrl}/${baseCurrency}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Exchange Rate API error: ${response.statusText}`);
  }

  return response.json();
}

// ============================================
// METAL PRICE API
// ============================================

async function fetchFromMetalPriceAPI(): Promise<any> {
  const url = API_CONFIG.METAL_PRICE.baseUrl;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Metal Price API error: ${response.statusText}`);
  }

  return response.json();
}

// ============================================
// COINGECKO API
// ============================================

async function fetchFromCoinGecko(endpoint: string, params?: Record<string, string>): Promise<any> {
  const queryParams = new URLSearchParams(params || {});
  const url = `${API_CONFIG.COINGECKO.baseUrl}${endpoint}?${queryParams}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`CoinGecko API error: ${response.statusText}`);
  }

  return response.json();
}

// ============================================
// UNIFIED FETCH FUNCTIONS WITH FALLBACK
// ============================================

/**
 * Fetch Forex Exchange Rate with fallback mechanism
 */
export async function fetchForexRate(
  fromCurrency: string,
  toCurrency: string
): Promise<Asset> {
  const cacheKey = `forex_${fromCurrency}_${toCurrency}`;
  const cached = await getCachedData(cacheKey);
  if (cached) return cached;

  const healthyProviders = await getHealthyProviders();

  for (const provider of healthyProviders) {
    try {
      let asset: Asset | null = null;

      if (provider === 'ALPHA_VANTAGE') {
        const data = await fetchFromAlphaVantage('CURRENCY_EXCHANGE_RATE', {
          from_currency: fromCurrency,
          to_currency: toCurrency,
        });

        const rate = data['Realtime Currency Exchange Rate'];
        if (!rate) throw new Error('Invalid response format');

        const price = parseFloat(rate['5. Exchange Rate']);
        const prevClose = parseFloat(rate['8. Previous Close'] || price);
        const change = price - prevClose;
        const changePercent = (change / prevClose) * 100;

        asset = {
          id: `${fromCurrency}${toCurrency}`,
          symbol: `${fromCurrency}/${toCurrency}`,
          name: `${fromCurrency} to ${toCurrency}`,
          type: 'forex',
          price,
          change24h: change,
          change24hPercent: changePercent,
          lastUpdated: Date.now(),
          provider: 'Alpha Vantage',
        };
      } else if (provider === 'EXCHANGE_RATE') {
        const data = await fetchFromExchangeRateAPI(fromCurrency);
        const rate = data.rates[toCurrency];
        if (!rate) throw new Error('Currency pair not found');

        asset = {
          id: `${fromCurrency}${toCurrency}`,
          symbol: `${fromCurrency}/${toCurrency}`,
          name: `${fromCurrency} to ${toCurrency}`,
          type: 'forex',
          price: rate,
          change24h: 0,
          change24hPercent: 0,
          lastUpdated: Date.now(),
          provider: 'Exchange Rate API',
        };
      } else if (provider === 'TWELVE_DATA') {
        const data = await fetchFromTwelveData('/quote', {
          symbol: `${fromCurrency}/${toCurrency}`,
          exchange: 'FOREX',
        });

        if (data.status !== 'ok') throw new Error('Invalid response');

        asset = {
          id: `${fromCurrency}${toCurrency}`,
          symbol: `${fromCurrency}/${toCurrency}`,
          name: `${fromCurrency} to ${toCurrency}`,
          type: 'forex',
          price: parseFloat(data.price),
          change24h: parseFloat(data.change) || 0,
          change24hPercent: parseFloat(data.percent_change) || 0,
          lastUpdated: Date.now(),
          provider: 'Twelve Data',
        };
      }

      if (asset) {
        await updateProviderHealth(provider, true);
        await setCachedData(cacheKey, asset);
        return asset;
      }
    } catch (error) {
      console.warn(`Failed to fetch from ${provider}:`, error);
      await updateProviderHealth(provider, false);
      continue;
    }
  }

  throw new Error('All providers failed to fetch forex rate');
}

/**
 * Fetch Commodity Price with fallback mechanism
 */
export async function fetchCommodityPrice(
  symbol: string,
  name: string
): Promise<Asset> {
  const cacheKey = `commodity_${symbol}`;
  const cached = await getCachedData(cacheKey);
  if (cached) return cached;

  const healthyProviders = await getHealthyProviders();

  for (const provider of healthyProviders) {
    try {
      let asset: Asset | null = null;

      if (provider === 'METAL_PRICE' && (symbol === 'XAUUSD' || symbol === 'XAGUSD')) {
        const data = await fetchFromMetalPriceAPI();
        const metalKey = symbol === 'XAUUSD' ? 'gold' : 'silver';
        const metalData = data[metalKey];

        if (!metalData) throw new Error('Metal not found');

        asset = {
          id: symbol,
          symbol,
          name,
          type: 'commodity',
          price: metalData.price,
          change24h: 0,
          change24hPercent: 0,
          lastUpdated: Date.now(),
          provider: 'Metal Price API',
        };
      } else if (provider === 'ALPHA_VANTAGE') {
        // Use Forex API for commodities
        const [from, to] = symbol.split('/');
        const data = await fetchFromAlphaVantage('CURRENCY_EXCHANGE_RATE', {
          from_currency: from,
          to_currency: to,
        });

        const rate = data['Realtime Currency Exchange Rate'];
        if (!rate) throw new Error('Invalid response format');

        const price = parseFloat(rate['5. Exchange Rate']);
        const prevClose = parseFloat(rate['8. Previous Close'] || price);
        const change = price - prevClose;
        const changePercent = (change / prevClose) * 100;

        asset = {
          id: symbol,
          symbol,
          name,
          type: 'commodity',
          price,
          change24h: change,
          change24hPercent: changePercent,
          lastUpdated: Date.now(),
          provider: 'Alpha Vantage',
        };
      }

      if (asset) {
        await updateProviderHealth(provider, true);
        await setCachedData(cacheKey, asset);
        return asset;
      }
    } catch (error) {
      console.warn(`Failed to fetch commodity from ${provider}:`, error);
      await updateProviderHealth(provider, false);
      continue;
    }
  }

  throw new Error('All providers failed to fetch commodity price');
}

/**
 * Fetch Cryptocurrency Price with fallback mechanism
 */
export async function fetchCryptoPrice(coinId: string): Promise<Asset> {
  const cacheKey = `crypto_${coinId}`;
  const cached = await getCachedData(cacheKey);
  if (cached) return cached;

  const healthyProviders = await getHealthyProviders();

  for (const provider of healthyProviders) {
    try {
      let asset: Asset | null = null;

      if (provider === 'COINGECKO') {
        const data = await fetchFromCoinGecko('/simple/price', {
          ids: coinId,
          vs_currencies: 'usd',
          include_24hr_change: 'true',
        });

        const coinData = data[coinId];
        if (!coinData) throw new Error('Coin not found');

        asset = {
          id: coinId,
          symbol: coinId.toUpperCase(),
          name: coinId.charAt(0).toUpperCase() + coinId.slice(1),
          type: 'crypto',
          price: coinData.usd,
          change24h: coinData.usd * (coinData.usd_24h_change / 100),
          change24hPercent: coinData.usd_24h_change,
          lastUpdated: Date.now(),
          provider: 'CoinGecko',
        };
      } else if (provider === 'TWELVE_DATA') {
        const data = await fetchFromTwelveData('/quote', {
          symbol: coinId.toUpperCase(),
          exchange: 'CRYPTO',
        });

        if (data.status !== 'ok') throw new Error('Invalid response');

        asset = {
          id: coinId,
          symbol: coinId.toUpperCase(),
          name: coinId.charAt(0).toUpperCase() + coinId.slice(1),
          type: 'crypto',
          price: parseFloat(data.price),
          change24h: parseFloat(data.change) || 0,
          change24hPercent: parseFloat(data.percent_change) || 0,
          lastUpdated: Date.now(),
          provider: 'Twelve Data',
        };
      }

      if (asset) {
        await updateProviderHealth(provider, true);
        await setCachedData(cacheKey, asset);
        return asset;
      }
    } catch (error) {
      console.warn(`Failed to fetch crypto from ${provider}:`, error);
      await updateProviderHealth(provider, false);
      continue;
    }
  }

  throw new Error('All providers failed to fetch crypto price');
}

/**
 * Fetch Historical Data with fallback mechanism
 */
export async function fetchAssetHistory(
  asset: Asset,
  period: string = '7d'
): Promise<HistoricalData[]> {
  const cacheKey = `history_${asset.id}_${period}`;
  const cached = await getCachedData(cacheKey);
  if (cached) return cached;

  const healthyProviders = await getHealthyProviders();

  for (const provider of healthyProviders) {
    try {
      let history: HistoricalData[] = [];

      if (asset.type === 'crypto' && provider === 'COINGECKO') {
        const days = period === '1d' ? 1 : period === '7d' ? 7 : period === '30d' ? 30 : 7;
        const data = await fetchFromCoinGecko('/coins/{id}/market_chart', {
          vs_currency: 'usd',
          days: days.toString(),
        });

        history = data.prices.map((item: [number, number], index: number) => ({
          timestamp: item[0],
          open: item[1],
          high: item[1],
          low: item[1],
          close: item[1],
          volume: data.total_volumes[index]?.[1] || 0,
        }));
      } else if (provider === 'ALPHA_VANTAGE') {
        const [from, to] = asset.symbol.split('/');
        const data = await fetchFromAlphaVantage('FX_DAILY', {
          from_symbol: from,
          to_symbol: to,
          outputsize: 'compact',
        });

        const timeSeriesKey = Object.keys(data).find(key => key.includes('Time Series'));
        if (!timeSeriesKey) throw new Error('Invalid response');

        const timeSeries = data[timeSeriesKey];
        history = Object.entries(timeSeries)
          .map(([timestamp, values]: [string, any]) => ({
            timestamp: new Date(timestamp).getTime(),
            open: parseFloat(values['1. open']),
            high: parseFloat(values['2. high']),
            low: parseFloat(values['3. low']),
            close: parseFloat(values['4. close']),
            volume: 0,
          }))
          .reverse();
      }

      if (history.length > 0) {
        await updateProviderHealth(provider, true);
        await setCachedData(cacheKey, history);
        return history;
      }
    } catch (error) {
      console.warn(`Failed to fetch history from ${provider}:`, error);
      await updateProviderHealth(provider, false);
      continue;
    }
  }

  throw new Error('All providers failed to fetch historical data');
}

// ============================================
// PREDEFINED ASSETS
// ============================================

export const FOREX_PAIRS = [
  { from: 'EUR', to: 'USD', name: 'Euro / US Dollar' },
  { from: 'GBP', to: 'USD', name: 'British Pound / US Dollar' },
  { from: 'USD', to: 'JPY', name: 'US Dollar / Japanese Yen' },
  { from: 'USD', to: 'CHF', name: 'US Dollar / Swiss Franc' },
  { from: 'AUD', to: 'USD', name: 'Australian Dollar / US Dollar' },
  { from: 'USD', to: 'CAD', name: 'US Dollar / Canadian Dollar' },
];

export const COMMODITIES = [
  { symbol: 'XAUUSD', name: 'Gold', id: 'gold' },
  { symbol: 'XAGUSD', name: 'Silver', id: 'silver' },
];

export const CRYPTOCURRENCIES = [
  { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC' },
  { id: 'ethereum', name: 'Ethereum', symbol: 'ETH' },
  { id: 'cardano', name: 'Cardano', symbol: 'ADA' },
  { id: 'ripple', name: 'Ripple', symbol: 'XRP' },
];

// ============================================
// BATCH FETCH FUNCTIONS
// ============================================

/**
 * Fetch all market data with fallback
 */
export async function fetchAllMarketData(): Promise<Asset[]> {
  const assets: Asset[] = [];

  try {
    // Fetch Forex pairs
    for (const pair of FOREX_PAIRS) {
      try {
        const asset = await fetchForexRate(pair.from, pair.to);
        assets.push(asset);
      } catch (error) {
        console.error(`Error fetching ${pair.from}/${pair.to}:`, error);
      }
    }

    // Fetch Commodities
    for (const commodity of COMMODITIES) {
      try {
        const asset = await fetchCommodityPrice(commodity.symbol, commodity.name);
        assets.push(asset);
      } catch (error) {
        console.error(`Error fetching ${commodity.name}:`, error);
      }
    }

    // Fetch Cryptocurrencies
    for (const crypto of CRYPTOCURRENCIES) {
      try {
        const asset = await fetchCryptoPrice(crypto.id);
        assets.push(asset);
      } catch (error) {
        console.error(`Error fetching ${crypto.name}:`, error);
      }
    }
  } catch (error) {
    console.error('Error fetching market data:', error);
  }

  return assets;
}

/**
 * Get provider health status
 */
export async function getProvidersStatus(): Promise<ProviderHealth[]> {
  const providers = Object.keys(API_CONFIG);
  const status: ProviderHealth[] = [];

  for (const provider of providers) {
    const health = await getProviderHealth(provider);
    status.push(health);
  }

  return status;
}
