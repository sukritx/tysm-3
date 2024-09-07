const express = require("express");
const { getDashboardData, addCoinsToUser } = require("../controllers/adminController");

const router = express.Router();

router.get("/dashboard", getDashboardData);
router.post("/add-coins", addCoinsToUser);

module.exports = router;