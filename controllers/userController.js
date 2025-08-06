const axios = require("axios");
const stripe = require("stripe")(process.env.SECRET_KEY);

const ethers = require("ethers");
const { contractAddress, infuraID, Abi } = require("../constants/index");

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

module.exports.register = async (req, res, next) => {
  try {
    console.log("request arrives", req.body);

    const myPayment = await stripe.paymentIntents.create({
amount: req.body.amount * 100,
      currency: "usd",
      payment_method: req.body.paymentMethodId,
      metadata: {
        company: "MCAA",
      },
    });

    res
      .status(200)
      .json({ success: true, client_secret: myPayment.client_secret });
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
