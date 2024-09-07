const express = require("express");
const { getDashboardData } = require("../controllers/adminController");

const router = express.Router();

router.get("/dashboard", getDashboardData);

module.exports = router;