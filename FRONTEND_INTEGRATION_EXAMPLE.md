# Frontend Integration Example - Displaying ETH Amounts

## Overview
This guide shows how to integrate with the backend API to display ETH amounts as the primary price while Stripe processes USD in the background.

## Key Principle
- **Display**: Show ETH amounts to users
- **Payment**: Stripe processes in USD (converted automatically)
- **User Experience**: Users see and think in ETH, but pay in USD

## Implementation Examples

### 1. Fetching and Displaying NFT Price

```javascript
// Fetch price for a specific tier
async function displayNFTPrice(tier) {
  try {
    const response = await fetch(`/api/admin/nft-price/${tier}`);
    const data = await response.json();
    
    if (data.success) {
      // Display ETH as primary amount
      document.getElementById('nft-price').innerHTML = `
        <div class="price-display">
          <h2>${data.priceInETH} ETH</h2>
          <p class="usd-reference">≈ $${data.priceInUSD} USD</p>
        </div>
      `;
    }
  } catch (error) {
    console.error('Error fetching price:', error);
  }
}
```

### 2. Payment Flow with ETH Display

```javascript
// Initialize payment with ETH display
async function initializePayment(tier, paymentMethodId) {
  try {
    // Show loading state with ETH amount
    showLoading('Processing payment...');
    
    const response = await fetch('/api/admin/mint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tier: tier,
        paymentMethodId: paymentMethodId
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Display confirmation with ETH amount
      showConfirmation(`
        <h3>Payment Initiated</h3>
        <p>Amount: ${data.priceDetails.ethPrice} ETH</p>
        <p class="small-text">Charged: $${data.priceDetails.usdPrice} USD</p>
      `);
      
      // Confirm payment with Stripe
      const result = await stripe.confirmCardPayment(data.client_secret);
      
      if (result.error) {
        showError(result.error.message);
      } else {
        showSuccess(`Successfully purchased NFT for ${data.priceDetails.ethPrice} ETH!`);
      }
    }
  } catch (error) {
    showError('Payment failed. Please try again.');
  }
}
```

### 3. React Component Example

```jsx
import React, { useState, useEffect } from 'react';

function NFTMintButton({ tier }) {
  const [price, setPrice] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchPrice();
  }, [tier]);
  
  const fetchPrice = async () => {
    try {
      const response = await fetch(`/api/admin/nft-price/${tier}`);
      const data = await response.json();
      if (data.success) {
        setPrice(data);
      }
    } catch (error) {
      console.error('Error fetching price:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleMint = async () => {
    // Payment logic here
  };
  
  if (loading) return <div>Loading price...</div>;
  
  return (
    <div className="nft-mint-container">
      <div className="price-display">
        <span className="eth-amount">{price?.priceInETH} ETH</span>
        <span className="usd-reference">(≈ ${price?.priceInUSD})</span>
      </div>
      <button onClick={handleMint} className="mint-button">
        Mint NFT for {price?.priceInETH} ETH
      </button>
    </div>
  );
}
```

### 4. CSS Styling Example

```css
/* ETH as primary display */
.price-display {
  text-align: center;
  margin: 20px 0;
}

.eth-amount {
  font-size: 2.5rem;
  font-weight: bold;
  color: #627EEA; /* Ethereum blue */
  display: block;
}

.usd-reference {
  font-size: 1rem;
  color: #666;
  margin-top: 5px;
  display: block;
}

.mint-button {
  background-color: #627EEA;
  color: white;
  padding: 15px 30px;
  font-size: 1.2rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.mint-button:hover {
  background-color: #4c63b6;
}

/* Small USD reference */
.small-text {
  font-size: 0.875rem;
  color: #888;
  font-style: italic;
}
```

### 5. Price Display Component with Auto-refresh

```javascript
// Component that refreshes ETH price every 30 seconds
class PriceDisplay {
  constructor(tier, elementId) {
    this.tier = tier;
    this.element = document.getElementById(elementId);
    this.refreshInterval = 30000; // 30 seconds
    this.intervalId = null;
  }
  
  async updatePrice() {
    try {
      const response = await fetch(`/api/admin/nft-price/${this.tier}`);
      const data = await response.json();
      
      if (data.success) {
        this.element.innerHTML = `
          <div class="eth-price-widget">
            <div class="main-price">${data.priceInETH} ETH</div>
            <div class="sub-price">≈ $${data.priceInUSD}</div>
            <div class="last-updated">
              Rate: $${data.ethToUsdRate}/ETH
            </div>
          </div>
        `;
      }
    } catch (error) {
      console.error('Error updating price:', error);
    }
  }
  
  start() {
    this.updatePrice(); // Initial load
    this.intervalId = setInterval(() => this.updatePrice(), this.refreshInterval);
  }
  
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
}

// Usage
const priceDisplay = new PriceDisplay(1, 'price-container');
priceDisplay.start();
```

## Best Practices

1. **Always Show ETH First**: ETH amount should be the prominent display
2. **USD as Reference**: Show USD in smaller text or parentheses
3. **Clear Messaging**: Make it clear that payment is in USD but for ETH amount
4. **Price Volatility Notice**: Consider adding a note about price fluctuations

### Example Messages:
- "Mint for 0.1 ETH (≈ $250.00)"
- "Total: 0.1 ETH • Charging $250.00 USD"
- "You're purchasing 0.1 ETH worth • Billed as $250.00"

## Handling Price Updates

Since ETH price fluctuates, consider:

1. **Lock Price During Checkout**: Once user initiates payment, lock the conversion rate
2. **Show Expiration**: "This price valid for 5 minutes"
3. **Auto-refresh Display**: Update displayed USD equivalent periodically
4. **Clear Timestamps**: Show when the price was last updated

## Error Handling

```javascript
// Graceful error handling with ETH focus
function handlePriceError(tier) {
  return {
    element: document.getElementById('price-display'),
    showError: function() {
      this.element.innerHTML = `
        <div class="price-error">
          <p>Unable to load current price</p>
          <button onclick="retryPriceLoad(${tier})">Retry</button>
        </div>
      `;
    }
  };
}
```

## Summary

The key is to make ETH the primary visual element while keeping USD conversions subtle but visible. This aligns with Web3 user expectations where crypto amounts are primary and fiat is secondary reference.