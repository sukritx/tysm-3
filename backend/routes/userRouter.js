const express = require("express");
const { postSignup, postLogin } = require("../controllers/authController");
const { authMiddleware } = require("../middleware/authMiddleware");
const { updateAccount, getUser, follow, unfollow, getFollowing, userSearch, getAllUniversities, getFacultiesByUniversity, updateFaculty, updateSchool, addFriend, acceptFriendRequest } = require("../controllers/userController");

const router = express.Router();

/* ------------------- User Signup --------------------- */
router.post("/signup", postSignup);
router.post ("/login", postLogin);
router.put("/update", authMiddleware, updateAccount);
router.get("/school", authMiddleware, getAllUniversities)
router.get("/faculties/:universityId", getFacultiesByUniversity);
router.patch("/update/:schoolId", authMiddleware, updateSchool)
router.patch("/update/:facultyId", authMiddleware, updateFaculty)

router.get("/", authMiddleware, getUser); // all user for homepage
router.get("/following", authMiddleware, getFollowing)
router.get("/:username", authMiddleware, userSearch); // for that user profile page
router.post("/follow/:id", authMiddleware, follow)
router.post("/unfollow/:id", authMiddleware, unfollow)

router.post('/add/:friendId', authMiddleware, addFriend);
router.post('/accept/:friendId', authMiddleware, acceptFriendRequest);

module.exports = router;