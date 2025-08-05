const axios = require("axios");
const stripe = require("stripe")(process.env.SECRET_KEY);

const ethers = require("ethers");
const { contractAddress, infuraID, Abi } = require("../constants/index");
const priceService = require("./priceService");

// let provider = new ethers.InfuraProvider("sepolia", infuraID); // ==> this was for sepolia

let provider = new ethers.InfuraProvider("homestead", infuraID); // ==> for the mainnet

let contract = new ethers.Contract(contractAddress, Abi, provider);

let privateKey = process.env.PRIVATE_KEY;
let wallet = new ethers.Wallet(privateKey, provider);

let contractWithSigner = contract.connect(wallet);

////////////////////////

// const { MongoClient, ObjectId } = require("mongodb");

// // Assuming you have a MongoDB client setup
// const uri = process.env.MONGO_URI;
// const client = new MongoClient(uri, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// });

// let database = client.db("MetaData");
// let collection = database.collection("MetaData");

/////////////////////////

// Function to get NFT price in ETH from smart contract
const getNFTPriceInETH = async (tier) => {
  try {
    const priceInWei = await contract.getTokenPrice(tier);
    // Convert from Wei to ETH
    const priceInETH = ethers.formatEther(priceInWei);
    return parseFloat(priceInETH);
  } catch (error) {
    console.error("Error fetching NFT price from contract:", error);
    throw error;
  }
};

module.exports.register = async (req, res, next) => {
  try {
    console.log("request arrives", req.body);
    
    const { tier } = req.body;
    
    // Get NFT price in ETH from smart contract
    const nftPriceInETH = await getNFTPriceInETH(tier);
    
    // Get current ETH to USD conversion rate using the price service
    const ethToUsdRate = await priceService.getETHtoUSD();
    
    // Calculate price in USD
    const priceInUSD = nftPriceInETH * ethToUsdRate;
    
    // Round to 2 decimal places for cents
    const amountInCents = Math.round(priceInUSD * 100);
    
    console.log(`NFT Tier ${tier}: ${nftPriceInETH} ETH = $${priceInUSD} USD (Rate: $${ethToUsdRate}/ETH)`);

    const myPayment = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: "usd",
      payment_method: req.body.paymentMethodId,
      metadata: {
        company: "MCAA",
        tier: tier.toString(),
        ethPrice: nftPriceInETH.toString(),
        usdRate: ethToUsdRate.toString(),
        calculatedUsdPrice: priceInUSD.toFixed(2)
      },
    });

    res
      .status(200)
      .json({ 
        success: true, 
        client_secret: myPayment.client_secret,
        priceDetails: {
          tier,
          ethPrice: nftPriceInETH,
          usdPrice: priceInUSD.toFixed(2),
          ethToUsdRate
        }
      });
  } catch (ex) {
    return res.json({ status: false, message: ex.message });
  }
};

module.exports.adminMint = async (req, res, next) => {
  try {
    console.log("request arrives", req.body);
    const { tier, walletAddress } = req.body;

    let mint = await contractWithSigner.adminMint(tier, walletAddress);

    await mint.wait();

    let tokenId = await contract.getTierMintingTokenId(tier);
    tokenId = Number(tokenId);
    console.log(tokenId);

    // console.log("mint: ", mint);

    res.status(200).json({ success: true, mint: mint, tokenId });
  } catch (ex) {
    return res.json({ status: false, message: ex.message });
  }
};

module.exports.checkBalance = async (req, res, next) => {
  try {
    let tokenId = await contract.balanceOf(req.query.address);
    tokenId = Number(tokenId);
    console.log(tokenId);

    // console.log("mint: ", mint);
    // console.log("mint: ", mint);

    res.status(200).json({ success: true, tokenId });
  } catch (ex) {
    return res.json({ status: false, message: ex.message });
  }
};

// New endpoint to get NFT price in USD for a specific tier
module.exports.getNFTPriceUSD = async (req, res, next) => {
  try {
    const { tier } = req.params;
    
    if (!tier) {
      return res.status(400).json({ 
        success: false, 
        message: "Tier parameter is required" 
      });
    }
    
    // Get NFT price in ETH from smart contract
    const nftPriceInETH = await getNFTPriceInETH(parseInt(tier));
    
    // Get current ETH to USD conversion rate
    const ethToUsdRate = await priceService.getETHtoUSD();
    
    // Calculate price in USD
    const priceInUSD = nftPriceInETH * ethToUsdRate;
    
    res.status(200).json({ 
      success: true,
      tier: parseInt(tier),
      priceInETH: nftPriceInETH,
      priceInUSD: priceInUSD.toFixed(2),
      ethToUsdRate,
      timestamp: new Date().toISOString()
    });
  } catch (ex) {
    return res.json({ status: false, message: ex.message });
  }
};

// Endpoint to refresh ETH price cache
module.exports.refreshETHPrice = async (req, res, next) => {
  try {
    // Force cache refresh by clearing it
    priceService.clearCache();
    
    const ethToUsdRate = await priceService.getETHtoUSD();
    
    res.status(200).json({ 
      success: true,
      ethToUsdRate,
      cacheUpdated: true,
      timestamp: new Date().toISOString()
    });
  } catch (ex) {
    return res.json({ status: false, message: ex.message });
  }
};

// New endpoint to get price service cache status
module.exports.getPriceCacheStatus = async (req, res, next) => {
  try {
    const cacheStatus = priceService.getCacheStatus();
    
    res.status(200).json({ 
      success: true,
      cache: cacheStatus,
      timestamp: new Date().toISOString()
    });
  } catch (ex) {
    return res.json({ status: false, message: ex.message });
  }
};


// module.exports.getTokenData = async (req, res, next) => {
//   try {
//     await client.connect();

//     const { tokenId } = req.params;
//     console.log("Received tokenId: ", tokenId);
//     if (!tokenId) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Token ID is required." });
//     }

//     // Convert tokenId from string to number if necessary
//     const numericTokenId = parseInt(tokenId, 10);
//     if (isNaN(numericTokenId)) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Invalid Token ID format." });
//     }

//     const tokenData = await collection.findOne({ tokenId: numericTokenId });

//     if (!tokenData) {
//       return res.status(404).json({
//         success: false,
//         message: "No data found for the provided Token ID.",
//       });
//     }

//     res.status(200).json({ tokenData });
//   } catch (ex) {
//     console.error("Error fetching token data:", ex);
//     return res.status(500).json({ success: false, message: ex.message });
//   } finally {
//     await client.close();
//   }
// };
