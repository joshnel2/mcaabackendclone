const {
  register,
  adminMint,
  checkBalance,
  getTokenData,
  checkEnvs,
} = require("../controllers/userController");

const router = require("express").Router();

router.post("/api/admin/mint", register);
router.post("/api/admin/adminMint", adminMint);
router.get("/api/admin/checkBalance", checkBalance);

module.exports = router;
