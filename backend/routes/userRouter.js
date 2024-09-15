const express = require("express");
const { postSignup, postLogin } = require("../controllers/authController");
const { authMiddleware } = require("../middleware/authMiddleware");
const { updateAccount, getUser, getWhoViewed, addFriend, acceptFriendRequest, unfriend, profileView, getUserMe, getAllSchools, uploadAvatar, getUserFriends } = require("../controllers/userController");

const router = express.Router();

/* ------------------- User Signup --------------------- */
router.post("/signup", postSignup);
router.post ("/login", postLogin);
router.get("/me", authMiddleware, getUserMe);
router.put("/update", authMiddleware, updateAccount);
router.post("/upload-avatar", authMiddleware, uploadAvatar);
router.get("/schools", authMiddleware, getAllSchools);

router.get("/", authMiddleware, getUser); // all user for homepage
router.get("/who-view", authMiddleware, getWhoViewed); // get users who viewed his/her profile
router.get("/:username", authMiddleware, profileView); // for that user profile page

router.get("/me/friends", authMiddleware, getUserFriends);

router.post("/add/:friendId", authMiddleware, addFriend);
router.post("/accept/:friendId", authMiddleware, acceptFriendRequest);
router.post("/unfriend/:friendId", authMiddleware, unfriend);

module.exports = router;