# FinTrack Mobile - Multi-Provider API Integration

## Overview

FinTrack Mobile now features a robust multi-provider API integration system with automatic fallback mechanisms. This ensures continuous data availability even when primary providers experience rate limits or service interruptions.

## Supported Providers

### 1. **Alpha Vantage** (Primary Provider)
- **Purpose**: Forex, Commodities, and Technical Indicators
- **Rate Limit**: 25 API calls/day (free tier)
- **Key**: `ALPHA_VANTAGE_KEY`
- **Features**:
  - Real-time currency exchange rates
  - Commodity prices (Gold, Silver via Forex API)
  - 30+ built-in technical indicators
  - Historical data (intraday & daily)

### 2. **Twelve Data** (Secondary Provider)
- **Purpose**: Forex, Crypto, and Commodities
- **Rate Limit**: 800 API calls/day (free tier)
- **Key**: `TWELVE_DATA_KEY`
- **Features**:
  - Real-time forex quotes
  - Cryptocurrency data
  - Multiple timeframes
  - WebSocket support (future enhancement)

### 3. **Exchange Rate API** (Tertiary Provider)
- **Purpose**: Forex/Currency Exchange Rates
- **Rate Limit**: 1,500 calls/month (free tier)
- **Key**: `EXCHANGE_RATE_KEY`
- **Features**:
  - Real-time exchange rates
  - Reliable fallback for forex pairs
  - Simple, fast API

### 4. **Metal Price API** (Specialized Provider)
- **Purpose**: Precious Metals (Gold, Silver)
- **Rate Limit**: 100 calls/day (free tier)
- **Key**: `METAL_PRICE_API_KEY`
- **Features**:
  - Real-time precious metal prices
  - Specialized commodity data
  - Accurate spot prices

### 5. **CoinGecko API** (Crypto Provider)
- **Purpose**: Cryptocurrency Data
- **Rate Limit**: 10-50 calls/second (free tier)
- **Key**: Not required (optional for higher limits)
- **Features**:
  - 18,990+ cryptocurrencies
  - Real-time prices and market data
  - Historical data
  - No authentication required

## Fallback Mechanism

The system automatically switches between providers based on:

1. **Provider Health Status**: Tracks success/failure rates
2. **Rate Limit Detection**: Identifies when providers are rate-limited
3. **Response Validation**: Ensures data quality before caching
4. **Priority Queue**: Uses configured provider priority order

### Fallback Flow

```
Request Asset Data
    ↓
Try Primary Provider (Alpha Vantage)
    ↓ (Success) → Return Data
    ↓ (Failure/Rate Limit)
Try Secondary Provider (Twelve Data)
    ↓ (Success) → Return Data
    ↓ (Failure/Rate Limit)
Try Tertiary Provider (Exchange Rate API)
    ↓ (Success) → Return Data
    ↓ (Failure/Rate Limit)
Try Specialized Provider (Metal Price API)
    ↓ (Success) → Return Data
    ↓ (Failure/Rate Limit)
Return Cached Data (if available)
    ↓ (No Cache)
Return Error
```

## Asset Type Labels

All assets are clearly labeled with their type:

### **Forex** 🔵
- Badge Color: Blue
- Examples: EUR/USD, GBP/USD, USD/JPY
- Provider: Alpha Vantage, Twelve Data, Exchange Rate API

### **Commodities** 🟡
- Badge Color: Yellow/Gold
- Examples: Gold (XAUUSD), Silver (XAGUSD)
- Provider: Metal Price API, Alpha Vantage

### **Cryptocurrencies** 🟣
- Badge Color: Purple
- Examples: Bitcoin (BTC), Ethereum (ETH), Cardano (ADA)
- Provider: CoinGecko, Twelve Data

## Technical Indicators with Asset Context

All technical indicators now include:

1. **Asset Identification**
   - Asset Symbol (e.g., EUR/USD, BTC)
   - Asset Type (Forex/Commodity/Crypto)
   - Asset Name (full name)

2. **Signal Information**
   - Signal Type: Buy/Sell/Neutral
   - Signal Strength: 0-100 (confidence level)
   - Indicator Name: RSI, MACD, Bollinger Bands, etc.

3. **Visual Indicators**
   - Color coding by signal type
   - Strength visualization
   - Provider attribution

### Available Indicators

- **Trend**: SMA, EMA, WMA, MACD
- **Momentum**: RSI, Stochastic, MACD Signal
- **Volatility**: Bollinger Bands, ATR
- **Support**: Moving Average Crossovers

## Mobile Responsiveness

### Mobile Breakpoints (< 768px)
- Optimized card layouts
- Touch-friendly buttons and controls
- Readable font sizes
- Single-column layout
- Optimized spacing and padding

### Tablet Breakpoints (768px - 1024px)
- Two-column layouts where appropriate
- Larger cards with more information
- Enhanced spacing

### Desktop Breakpoints (> 1024px)
- Multi-column layouts
- Expanded information display
- Optimized for larger screens
- Sidebar navigation support

## Environment Variables

Set the following environment variables in your `.env` file:

```env
# Alpha Vantage
ALPHA_VANTAGE_KEY=your_key_here

# Twelve Data
TWELVE_DATA_KEY=your_key_here

# Exchange Rate API
EXCHANGE_RATE_KEY=your_key_here

# Metal Price API
METAL_PRICE_API_KEY=your_key_here

# CoinGecko (optional)
COINGECKO_API_KEY=your_key_here
```

## Usage Examples

### Fetch Forex Rate with Fallback

```typescript
import { fetchForexRate } from '@/lib/multi-provider-api';

const rate = await fetchForexRate('EUR', 'USD');
console.log(`${rate.symbol}: ${rate.price} (${rate.provider})`);
// Output: EUR/USD: 1.0850 (Alpha Vantage)
```

### Fetch Commodity Price with Fallback

```typescript
import { fetchCommodityPrice } from '@/lib/multi-provider-api';

const gold = await fetchCommodityPrice('XAUUSD', 'Gold');
console.log(`${gold.name}: ${gold.price} (${gold.provider})`);
// Output: Gold: 2050.50 (Metal Price API)
```

### Fetch Cryptocurrency Price with Fallback

```typescript
import { fetchCryptoPrice } from '@/lib/multi-provider-api';

const bitcoin = await fetchCryptoPrice('bitcoin');
console.log(`${bitcoin.name}: $${bitcoin.price} (${bitcoin.provider})`);
// Output: Bitcoin: $45000.00 (CoinGecko)
```

### Calculate Indicators with Asset Context

```typescript
import { calculateAllIndicators } from '@/lib/indicators-enhanced';
import { fetchAssetHistory } from '@/lib/multi-provider-api';

const asset = await fetchForexRate('EUR', 'USD');
const history = await fetchAssetHistory(asset, '7d');
const signals = calculateAllIndicators(asset, history);

signals.forEach(signal => {
  console.log(`${signal.assetSymbol} (${signal.assetType}): ${signal.indicatorName} = ${signal.signal}`);
});
// Output:
// EUR/USD (forex): RSI (14) = buy
// EUR/USD (forex): MACD = neutral
// EUR/USD (forex): Bollinger Bands = sell
```

## Caching Strategy

- **Cache Duration**: 60 seconds
- **Storage**: AsyncStorage (React Native)
- **Invalidation**: Automatic after 60 seconds
- **Fallback**: Returns cached data if all providers fail

## Error Handling

The system implements graceful error handling:

1. **Provider Failure**: Automatically tries next provider
2. **Rate Limiting**: Detects and marks provider as unhealthy
3. **Invalid Data**: Validates responses before caching
4. **Network Errors**: Returns cached data or error message

## Provider Health Monitoring

Monitor provider health status:

```typescript
import { getProvidersStatus } from '@/lib/multi-provider-api';

const status = await getProvidersStatus();
status.forEach(provider => {
  console.log(`${provider.provider}: ${provider.isHealthy ? 'Healthy' : 'Unhealthy'}`);
  console.log(`  Success: ${provider.successCount}, Failures: ${provider.failureCount}`);
});
```

## Best Practices

1. **Use Fallback Mechanism**: Always rely on the multi-provider system
2. **Handle Errors Gracefully**: Implement error boundaries in UI
3. **Cache Responses**: Minimize API calls with caching
4. **Monitor Health**: Check provider status periodically
5. **Rate Limiting**: Be aware of daily/monthly limits
6. **Asset Type Awareness**: Always display asset type with signals

## Future Enhancements

- [ ] WebSocket support for real-time updates
- [ ] Provider performance analytics
- [ ] Custom provider configuration
- [ ] Historical provider statistics
- [ ] Predictive provider selection
- [ ] Rate limit estimation

## Troubleshooting

### All Providers Failing
1. Check internet connection
2. Verify API keys in environment variables
3. Check provider status pages
4. Review error logs for specific failures

### Rate Limiting
1. Check daily/monthly limits for each provider
2. Reduce polling frequency
3. Implement request batching
4. Use cached data when available

### Slow Response Times
1. Check network latency
2. Verify provider response times
3. Review cache hit rates
4. Consider implementing request queuing

## Support

For issues or questions:
1. Check provider documentation
2. Review error logs
3. Verify API keys and environment variables
4. Test individual providers directly
