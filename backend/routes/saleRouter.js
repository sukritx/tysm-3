const express = require("express");
const { authMiddleware } = require("../middleware/authMiddleware");
const { buyVIP } = require("../controllers/saleController");

const router = express.Router();

router.post("/buy-vip", authMiddleware, buyVIP);

module.exports = router;