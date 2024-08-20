const express = require("express");
const { postSignup, postLogin } = require("../controllers/authController");
const { authMiddleware } = require("../middleware/authMiddleware");
const { updateAccount, getUser, userSearch, getWhoViewed, addFriend, acceptFriendRequest, unfriend } = require("../controllers/userController");

const router = express.Router();

/* ------------------- User Signup --------------------- */
router.post("/signup", postSignup);
router.post ("/login", postLogin);
router.put("/update", authMiddleware, updateAccount);

router.get("/", authMiddleware, getUser); // all user for homepage
router.get("/:igUsername", authMiddleware, userSearch); // for that user profile page
router.get("/who-view", authMiddleware, getWhoViewed); // get users who viewed his/her profile

router.post("/add/:friendId", authMiddleware, addFriend);
router.post("/accept/:friendId", authMiddleware, acceptFriendRequest);
router.post("/unfriend/:friendId", authMiddleware, unfriend);

module.exports = router;