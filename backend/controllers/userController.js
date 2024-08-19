const { User } = require("../models/user.model");
const { Account } = require("../models/user.model");
const { School } = require("../models/school.model")
const mongoose = require("mongoose");
const zod = require("zod");
require('dotenv').config()

const updateAccountSchema = zod.object({
    biography: zod.string().max(500).optional(),
    avatar: zod.string().url().optional(),
    instagram: zod.string().max(30).optional(),
    school: zod.string().max(100).optional()
});
const updateAccount = async (req, res) => {
    try {
        const { success, data } = updateAccountSchema.safeParse(req.body);
        
        if (!success) {
            return res.status(400).json({ error: "Invalid input data" });
        }

        const userId = req.userId; // set by your authMiddleware

        const updatedFields = {};

        if (data.biography !== undefined) {
            updatedFields.biography = data.biography;
        }

        if (data.avatar !== undefined) {
            updatedFields.avatar = data.avatar;
        }

        if (data.instagram !== undefined) {
            updatedFields.instagram = data.instagram.toLowerCase();
        }

        if (data.school !== undefined) {
            updatedFields.school = data.school;
        }

        const updatedAccount = await Account.findOneAndUpdate(
            { userId: userId },
            { $set: updatedFields },
            { new: true, runValidators: true }
        );

        if (!updatedAccount) {
            return res.status(404).json({ error: "Account not found" });
        }

        res.json({
            message: "Account updated successfully",
            account: {
                biography: updatedAccount.biography,
                avatar: updatedAccount.avatar,
                instagram: updatedAccount.instagram,
                school: updatedAccount.school
            }
        });

    } catch (error) {
        console.error("Error updating account:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

const getAllUniversities = async (req, res) => {
    try {
        const universities = await School.find({ schoolType: 'university' }).select('schoolName');

        if (!universities || universities.length === 0) {
            return res.status(404).json({
                message: "No universities found"
            });
        }

        res.status(200).json(universities);
    } catch (err) {
        console.error("Error fetching universities:", err);
        res.status(500).json({
            message: "Internal server error"
        });
    }
};

const updateSchool = async (req, res) => {
    try {
        const schoolId = req.params.schoolId;
        const updateData = req.body;

        // Find the school by ID and update it with the new data
        const updatedSchool = await School.findByIdAndUpdate(schoolId, updateData, {
            new: true, // Return the updated document
            runValidators: true // Run schema validation on the update
        });

        if (!updatedSchool) {
            return res.status(404).json({
                message: "School not found"
            });
        }

        res.status(200).json({
            message: "School updated successfully",
            data: updatedSchool
        });
    } catch (err) {
        console.error("Error updating school:", err);
        res.status(500).json({
            message: "Internal server error"
        });
    }
};

const getUser = async (req, res) => {
    try {
        const filter = req.query.filter || "";

        const users = await Account.find({
            $or: [
                {
                    instagram: { "$regex": filter, "$options": "i" }
                }
            ]
        })

        res.json({
            user: users.map(filteredUser => ({
                _id: filteredUser._id,
                instagram: filteredUser.instagram,
                faculty: filteredUser.faculty
            }))
        })


    } catch (err) {
        return res.status(400).json({ error: err.message})
    }
};

const userSearch = async (req, res) => {
    try {
        const username = req.params.username.toLowerCase(); // Convert to lowercase

        // Find the user by username
        const user = await User.findOne({ username }).select('_id');

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        // Use the user ID to find the account
        const account = await Account.findOne({ userId: user._id }).select('biography school faculty followersId');

        if (!account) {
            return res.status(404).json({
                message: "Account not found"
            });
        }

        // Extract biography, school, and faculty from the account object
        const { biography, school, faculty, followersId } = account;

        // Count the number of followers
        const numberOfFollowers = followersId.length;

        // Send response with biography, school, faculty, and number of followers
        return res.json({
            data: {
                biography,
                school,
                faculty,
                numberOfFollowers
            }
        });

    } catch (err) {
        return res.status(400).json({ error: err.message });
    }
};

const addFriend = async (req, res) => {
    try {
        const { friendId } = req.params; // ID of the user to be added as a friend
        const userId = req.userId; // ID of the current user, should be set by authentication middleware

        if (userId === friendId) {
            return res.status(400).json({ message: "You cannot add yourself as a friend" });
        }

        // Find the accounts of both users
        const userAccount = await Account.findOne({ userId });
        const friendAccount = await Account.findOne({ userId: friendId });

        if (!userAccount || !friendAccount) {
            return res.status(404).json({ message: "User not found" });
        }

        // Check if a friend request already exists
        const alreadySentRequest = userAccount.sentFriendRequest.some(request => request.userId.toString() === friendId);
        const alreadyReceivedRequest = friendAccount.receivedFriendRequest.some(request => request.userId.toString() === userId);

        if (alreadySentRequest || alreadyReceivedRequest) {
            return res.status(400).json({ message: "Friend request already exists" });
        }

        // Add the friend request
        userAccount.sentFriendRequest.push({ userId: friendId });
        friendAccount.receivedFriendRequest.push({ userId });

        await userAccount.save();
        await friendAccount.save();

        res.status(200).json({ message: "Friend request sent successfully" });
    } catch (error) {
        console.error("Error adding friend:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

const acceptFriendRequest = async (req, res) => {
    try {
        const { friendId } = req.params; // ID of the user whose friend request is being accepted
        const userId = req.userId; // ID of the current user, should be set by authentication middleware

        // Find the accounts of both users
        const userAccount = await Account.findOne({ userId });
        const friendAccount = await Account.findOne({ userId: friendId });

        if (!userAccount || !friendAccount) {
            return res.status(404).json({ message: "User not found" });
        }

        // Check if the friend request exists
        const receivedRequestIndex = userAccount.receivedFriendRequest.findIndex(request => request.userId.toString() === friendId);
        const sentRequestIndex = friendAccount.sentFriendRequest.findIndex(request => request.userId.toString() === userId);

        if (receivedRequestIndex === -1 || sentRequestIndex === -1) {
            return res.status(400).json({ message: "Friend request not found" });
        }

        // Remove the friend request
        userAccount.receivedFriendRequest.splice(receivedRequestIndex, 1);
        friendAccount.sentFriendRequest.splice(sentRequestIndex, 1);

        // Add each other to friends list
        userAccount.friendsList.push({ friendId: friendAccount.userId });
        friendAccount.friendsList.push({ friendId: userAccount.userId });

        await userAccount.save();
        await friendAccount.save();

        res.status(200).json({ message: "Friend request accepted successfully" });
    } catch (error) {
        console.error("Error accepting friend request:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

const unfriend = async (req, res) => {
    try {
        const userId = req.userId;
        const friendId = req.params.id;

        // Remove friendId from userId's friends list
        await Account.findOneAndUpdate(
            { userId },
            { $pull: { friendsList: { friendId } } }
        );

        // Remove userId from friendId's friends list
        await Account.findOneAndUpdate(
            { userId: friendId },
            { $pull: { friendsList: { friendId: userId } } }
        );

        return res.status(200).json({ message: 'Friend removed successfully' });
    } catch (err) {
        return res.status(400).json({ error: err.message });
    }
}

module.exports = {
    updateAccount,
    getAllUniversities,
    getFacultiesByUniversity,
    updateSchool,
    updateFaculty,
    getUser,
    userSearch,
    addFriend,
    acceptFriendRequest,
    unfriend
}