# NFT Pricing Guide - ETH to USD Conversion

## Overview
This implementation automatically converts NFT prices from ETH (stored on-chain) to USD for Stripe payments using real-time exchange rates.

## How It Works

1. **Smart Contract Integration**: The NFT prices are stored on-chain in ETH (Wei) for each tier
2. **Real-time Conversion**: When a payment is initiated, the system:
   - Fetches the NFT price in ETH from the smart contract using `getTokenPrice(tier)`
   - Gets the current ETH to USD exchange rate from multiple price feeds
   - Calculates the USD amount and creates a Stripe payment intent

3. **Multi-Source Price Feeds**: The system tries multiple price sources in order:
   - CoinGecko (primary)
   - Coinbase (secondary)
   - Binance (tertiary)

4. **Intelligent Caching**: ETH prices are cached with configurable TTL to avoid API rate limits

5. **Fallback Mechanisms**: 
   - Expired cache as first fallback
   - Environment variable price as last resort

## API Endpoints

### 1. Create Payment (Updated)
**POST** `/api/admin/mint`

Request body:
```json
{
  "tier": 1,
  "paymentMethodId": "pm_xxx"
}
```

Response:
```json
{
  "success": true,
  "client_secret": "pi_xxx_secret_xxx",
  "priceDetails": {
    "tier": 1,
    "ethPrice": 0.1,
    "usdPrice": "250.00",
    "ethToUsdRate": 2500
  }
}
```

### 2. Get NFT Price in USD
**GET** `/api/admin/nft-price/:tier`

Example: `/api/admin/nft-price/1`

Response:
```json
{
  "success": true,
  "tier": 1,
  "priceInETH": 0.1,
  "priceInUSD": "250.00",
  "ethToUsdRate": 2500,
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### 3. Refresh ETH Price Cache
**POST** `/api/admin/refresh-eth-price`

Forces a refresh of the cached ETH price.

Response:
```json
{
  "success": true,
  "ethToUsdRate": 2500,
  "cacheUpdated": true,
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### 4. Get Price Cache Status
**GET** `/api/admin/price-cache-status`

Check the current status of the price cache.

Response:
```json
{
  "success": true,
  "cache": {
    "hasData": true,
    "isValid": true,
    "age": 120000,
    "ttl": 300000,
    "currentPrice": 2500
  },
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## Environment Configuration

Add these to your `.env` file:

```bash
# ETH Price Configuration
ETH_PRICE_CACHE_TTL=300000  # Cache TTL in milliseconds (5 minutes)
ETH_FALLBACK_PRICE=2500     # Fallback price if all feeds fail
```

## Frontend Integration

When creating a payment on the frontend:

```javascript
// Instead of passing a fixed amount
const response = await fetch('/api/admin/mint', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tier: selectedTier, // Pass the NFT tier
    paymentMethodId: paymentMethod.id
  })
});

const data = await response.json();
// Use data.client_secret for Stripe confirmation
// Display data.priceDetails to show the user the conversion
```

### Display Price Before Payment

```javascript
// Get current price for display
const priceResponse = await fetch(`/api/admin/nft-price/${tier}`);
const priceData = await priceResponse.json();

// Show to user
console.log(`NFT Price: ${priceData.priceInETH} ETH ($${priceData.priceInUSD} USD)`);
```

## Important Notes

1. **API Rate Limits**: The multi-source approach and caching help avoid rate limits

2. **Price Volatility**: ETH prices can be volatile. Consider:
   - Showing users the ETH price and USD conversion clearly
   - Adding a price expiration notice
   - Implementing a price lock mechanism for active checkouts

3. **Error Handling**: The system has multiple fallback mechanisms:
   - Multiple price feed sources
   - Cached prices (even if expired)
   - Environment variable fallback price

4. **Metadata**: All Stripe payments include metadata with:
   - NFT tier
   - ETH price at time of purchase
   - USD conversion rate used
   - Calculated USD price

## Testing

1. Test different tiers:
   ```bash
   curl http://localhost:5000/api/admin/nft-price/1
   curl http://localhost:5000/api/admin/nft-price/2
   ```

2. Test cache status:
   ```bash
   curl http://localhost:5000/api/admin/price-cache-status
   ```

3. Test cache refresh:
   ```bash
   curl -X POST http://localhost:5000/api/admin/refresh-eth-price
   ```

4. Test payment creation with tier parameter

5. Monitor the console logs for:
   - Which price feed is being used
   - Cache hits/misses
   - Fallback mechanisms

## Architecture

The system is organized into:

1. **Price Service** (`controllers/priceService.js`):
   - Manages multiple price feeds
   - Handles caching logic
   - Provides fallback mechanisms

2. **User Controller** (`controllers/userController.js`):
   - Integrates with smart contract
   - Handles Stripe payments
   - Provides API endpoints

## Future Improvements

1. **Premium API Keys**: Add support for authenticated APIs for better rate limits
2. **WebSocket Price Updates**: Real-time price updates for frontend
3. **Price History**: Store historical conversion rates
4. **Price Alerts**: Notify admins of significant price changes
5. **Custom Price Feeds**: Easy addition of new price sources
6. **Database Price Logging**: Log all conversions for audit trail