const axios = require("axios");

// Price feed configurations
const PRICE_FEEDS = {
  coingecko: {
    url: 'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd',
    parser: (data) => data.ethereum.usd,
    priority: 1
  },
  coinbase: {
    url: 'https://api.coinbase.com/v2/exchange-rates?currency=ETH',
    parser: (data) => parseFloat(data.data.rates.USD),
    priority: 2
  },
  binance: {
    url: 'https://api.binance.com/api/v3/ticker/price?symbol=ETHUSDT',
    parser: (data) => parseFloat(data.price),
    priority: 3
  }
};

// Cache configuration
const CACHE_CONFIG = {
  ttl: parseInt(process.env.ETH_PRICE_CACHE_TTL || 300000), // Default 5 minutes
  data: null,
  timestamp: null
};

class PriceService {
  constructor() {
    this.cache = { ...CACHE_CONFIG };
  }

  // Try multiple price feeds in order of priority
  async fetchPriceFromFeeds() {
    const feeds = Object.entries(PRICE_FEEDS).sort((a, b) => a[1].priority - b[1].priority);
    
    for (const [name, config] of feeds) {
      try {
        console.log(`Attempting to fetch ETH price from ${name}...`);
        const response = await axios.get(config.url, { timeout: 5000 });
        const price = config.parser(response.data);
        
        if (price && price > 0) {
          console.log(`Successfully fetched ETH price from ${name}: $${price}`);
          return price;
        }
      } catch (error) {
        console.warn(`Failed to fetch from ${name}:`, error.message);
        continue;
      }
    }
    
    throw new Error("All price feeds failed");
  }

  // Get ETH to USD price with caching and fallbacks
  async getETHtoUSD() {
    const now = Date.now();
    
    // Check cache validity
    if (this.cache.data && this.cache.timestamp && 
        (now - this.cache.timestamp) < this.cache.ttl) {
      console.log("Using cached ETH price:", this.cache.data);
      return this.cache.data;
    }
    
    try {
      // Fetch fresh price
      const price = await this.fetchPriceFromFeeds();
      
      // Update cache
      this.cache = {
        data: price,
        timestamp: now,
        ttl: this.cache.ttl
      };
      
      return price;
    } catch (error) {
      console.error("Error fetching ETH price:", error);
      
      // Use expired cache as fallback
      if (this.cache.data) {
        console.log("Using expired cached ETH price as fallback:", this.cache.data);
        return this.cache.data;
      }
      
      // Use environment variable fallback price if set
      if (process.env.ETH_FALLBACK_PRICE) {
        const fallbackPrice = parseFloat(process.env.ETH_FALLBACK_PRICE);
        console.log("Using environment fallback price:", fallbackPrice);
        return fallbackPrice;
      }
      
      throw new Error("Failed to get ETH price from any source");
    }
  }

  // Force cache refresh
  clearCache() {
    this.cache.timestamp = null;
    console.log("ETH price cache cleared");
  }

  // Get cache status
  getCacheStatus() {
    const now = Date.now();
    const isValid = this.cache.data && this.cache.timestamp && 
                   (now - this.cache.timestamp) < this.cache.ttl;
    
    return {
      hasData: !!this.cache.data,
      isValid,
      age: this.cache.timestamp ? now - this.cache.timestamp : null,
      ttl: this.cache.ttl,
      currentPrice: this.cache.data
    };
  }
}

// Export singleton instance
module.exports = new PriceService();