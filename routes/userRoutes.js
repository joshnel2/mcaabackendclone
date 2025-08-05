const {
  register,
  adminMint,
  checkBalance,
  getTokenData,
  checkEnvs,
  getNFTPriceUSD,
  refreshETHPrice,
  getPriceCacheStatus,
} = require("../controllers/userController");

const router = require("express").Router();

router.post("/api/admin/mint", register);
router.post("/api/admin/adminMint", adminMint);
router.get("/api/admin/checkBalance", checkBalance);
router.get("/api/admin/nft-price/:tier", getNFTPriceUSD);
router.post("/api/admin/refresh-eth-price", refreshETHPrice);
router.get("/api/admin/price-cache-status", getPriceCacheStatus);

module.exports = router;
