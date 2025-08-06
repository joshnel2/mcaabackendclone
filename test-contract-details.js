require('dotenv').config();
const ethers = require('ethers');
const { contractAddress, infuraID, Abi } = require('./constants/index');

async function checkContractDetails() {
  try {
    const provider = new ethers.InfuraProvider("homestead", infuraID);
    const contract = new ethers.Contract(contractAddress, Abi, provider);
    
    console.log('Contract Address:', contractAddress);
    console.log('Network: Ethereum Mainnet\n');
    
    // Try to check if there's a way to see how many tiers exist
    console.log('Checking tier prices...\n');
    
    // Test different tier numbers to see which ones are valid
    for (let tier = 0; tier <= 10; tier++) {
      try {
        const priceWei = await contract.getTokenPrice(tier);
        const priceETH = ethers.formatEther(priceWei);
        
        if (priceWei > 0) {
          console.log(`Tier ${tier}: ${priceETH} ETH (${priceWei} Wei)`);
        }
      } catch (error) {
        // Tier might not exist or price is 0
        if (error.message.includes('revert')) {
          console.log(`Tier ${tier}: Not configured or reverted`);
        }
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkContractDetails();