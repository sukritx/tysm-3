const { User, Account } = require("../models/user.model");
const { School } = require("../models/school.model")
const { notificationController } = require('../controllers/notificationController');
const { Club } = require('../models/club.model');
const mongoose = require("mongoose");
const zod = require("zod");
require('dotenv').config()

const getUserMe = async (req, res) => {
    try {
      const userId = req.userId;
  
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
  
      const user = await User.findById(userId).select('-password');
  
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
  
      const account = await Account.findOne({ userId: user._id })
        .select('biography school faculty whoView birthday interest instagram avatar coin vip')
        .populate('school', 'schoolName schoolType');
  
      const userInfo = {
        ...user.toObject(),
        ...(account ? account.toObject() : {}),
        uniqueViewers: account ? account.whoView.length : 0,
        id: user._id,
        coinBalance: account ? account.coin.balance : 0,
        vipLevel: account && account.vip ? account.vip.find(v => v.vipExpire > new Date())?.vipLevel || 0 : 0,
      };

      if (userInfo.whoView) {
          delete userInfo.whoView;
      }
  
      res.status(200).json({
        message: "User data retrieved successfully",
        user: userInfo
      });
  
    } catch (error) {
      console.error('Error in getUserMe:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  };

const getAllSchools = async (req, res) => {
    try {
        const schools = await School.find();
        res.status(200).json({
            message: "Schools retrieved successfully",
            schools: schools
        });
    } catch (error) {
        console.error('Error in getAllSchools:', error);
        res.status(500).json({ message: "Internal server error" });
    }
};

const updateAccountSchema = zod.object({
    biography: zod.string().max(500).nullable().optional(),
    avatar: zod.string().url().nullable().optional(),
    instagram: zod.string().max(30).nullable().optional(),
    school: zod.string().nullable().optional(),
    birthday: zod.string().nullable().optional(),
    interest: zod.string().max(20).nullable().optional()
}).strict();

const updateAccount = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { success, data, error } = updateAccountSchema.safeParse(req.body);
        
        if (!success) {
            console.error('Validation error:', error.format());
            return res.status(400).json({ error: "Invalid input data", details: error.format() });
        }

        const userId = req.userId;

        const updatedFields = {};

        if (data.biography !== undefined) {
            updatedFields.biography = data.biography;
        }

        if (data.instagram !== undefined) {
            updatedFields.instagram = data.instagram ? data.instagram.toLowerCase() : null;
        }

        if (data.birthday !== undefined) {
            updatedFields.birthday = data.birthday ? new Date(data.birthday) : null;
        }

        if (data.interest !== undefined) {
            updatedFields.interest = data.interest;
        }

        if (data.school !== undefined) {
            if (data.school && !mongoose.Types.ObjectId.isValid(data.school)) {
                return res.status(400).json({ error: "Invalid school ID" });
            }
            updatedFields.school = data.school ? new mongoose.Types.ObjectId(data.school) : null;
        }

        // Fetch the current account
        const currentAccount = await Account.findOne({ userId: userId }).session(session);
        if (!currentAccount) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ error: "Account not found" });
        }

        // Handle school update
        if (updatedFields.school !== undefined && updatedFields.school !== currentAccount.school) {
            const oldSchoolId = currentAccount.school;

            // Remove user from old school if exists
            if (oldSchoolId) {
                await School.findByIdAndUpdate(oldSchoolId, {
                    $pull: { members: userId },
                    $inc: { memberCount: -1 }
                }).session(session);
            }

            // Add user to new school if a new school is provided
            if (updatedFields.school) {
                await School.findByIdAndUpdate(updatedFields.school, {
                    $addToSet: { members: userId },
                    $inc: { memberCount: 1 }
                }).session(session);
            }
        }

        updatedFields.updatedAt = new Date();

        console.log('Updating account with fields:', updatedFields); // For debugging

        const updatedAccount = await Account.findOneAndUpdate(
            { userId: userId },
            { $set: updatedFields },
            { new: true, runValidators: true, session }
        );

        if (!updatedAccount) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ error: "Account not found" });
        }

        await session.commitTransaction();
        session.endSession();

        res.json({
            message: "Account updated successfully",
            account: {
                avatar: updatedAccount.avatar,
                biography: updatedAccount.biography,
                instagram: updatedAccount.instagram,
                school: updatedAccount.school,
                birthday: updatedAccount.birthday,
                interest: updatedAccount.interest
            }
        });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error("Error updating account:", error);
        res.status(500).json({ error: "Internal server error", details: error.message });
    }
};

const uploadAvatar = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const userId = req.userId; // Assuming this is set by your authMiddleware
        const avatarUrl = req.body.avatarUrl; // Assuming the avatar URL is sent in the request body

        if (!avatarUrl) {
            return res.status(400).json({ error: "Avatar URL is required" });
        }

        const updatedAccount = await Account.findOneAndUpdate(
            { userId: userId },
            { $set: { avatar: avatarUrl, updatedAt: new Date() } },
            { new: true, runValidators: true, session }
        );

        if (!updatedAccount) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ error: "Account not found" });
        }

        await session.commitTransaction();
        session.endSession();

        res.json({
            message: "Avatar uploaded successfully",
            avatar: updatedAccount.avatar
        });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error("Error uploading avatar:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

const getUser = async (req, res) => {
    try {
        const filter = req.query.filter || "";

        const users = await Account.aggregate([
            {
                $lookup: {
                    from: "users",
                    localField: "userId",
                    foreignField: "_id",
                    as: "userDetails"
                }
            },
            {
                $unwind: "$userDetails"
            },
            {
                $match: {
                    $or: [
                        { instagram: { $regex: filter, $options: "i" } },
                        { "userDetails.username": { $regex: filter, $options: "i" } }
                    ]
                }
            },
            {
                $project: {
                    _id: 1,
                    instagram: 1,
                    username: "$userDetails.username",
                    userId: "$userDetails._id",
                    avatar: 1
                }
            }
        ]);

        res.json({
            users: users.map(user => ({
                _id: user._id,
                userId: user.userId,
                instagram: user.instagram,
                username: user.username,
                avatar: user.avatar
            }))
        });

    } catch (err) {
        console.error("Error in getUser:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};

const profileView = async (req, res) => {
    try {
        const username = req.params.username.toLowerCase();
        const viewerId = req.userId;

        const user = await User.findOne({ username }).select('_id createdAt');

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const account = await Account.findOne({ userId: user._id })
            .select('biography school faculty whoView birthday interest instagram avatar vip')
            .populate('school', 'schoolName schoolType')
            .populate({
                path: 'whoView.userId',
                select: 'username'
            });

        if (!account) {
            return res.status(404).json({ message: "Account not found" });
        }

        const { biography, school, faculty, whoView, birthday, interest, instagram, avatar, vip } = account;

        const viewerAccount = await Account.findOne({ userId: viewerId });
        const isVip = viewerAccount && viewerAccount.vip.some(vip => vip.vipLevel >= 1 && vip.vipExpire > new Date());

        const isOwnProfile = viewerId === user._id.toString();

        // Update whoView only if it's not the user's own profile and the viewer is not VIP
        if (!isOwnProfile && !isVip) {
            const viewIndex = whoView.findIndex(view => view.userId._id.toString() === viewerId);
            if (viewIndex === -1) {
                account.whoView.push({ userId: viewerId, viewDate: new Date() });
            } else {
                account.whoView[viewIndex].viewDate = new Date();
            }
            await account.save();
        }

        // Count the number of unique viewers
        const uniqueViewers = new Set(whoView.map(view => view.userId._id.toString())).size;

        // Determine friend status
        let friendStatus = 'not_friends';
        if (viewerAccount) {
            if (viewerAccount.friendsList.some(friend => friend.friendId.toString() === user._id.toString())) {
                friendStatus = 'friends';
            } else if (viewerAccount.sentFriendRequest.some(request => request.userId.toString() === user._id.toString())) {
                friendStatus = 'pending_sent';
            } else if (viewerAccount.receivedFriendRequest.some(request => request.userId.toString() === user._id.toString())) {
                friendStatus = 'pending_received';
            }
        }

        // Get the clubs the user is going to today
        const todaysClubs = await Club.find({ 'goingToday.userId': user._id }).select('_id clubName');

        // Prepare the whoView data
        let whoViewData;
        if (isOwnProfile && isVip) {
            // Sort whoView by date, most recent first
            const sortedWhoView = account.whoView.sort((a, b) => b.viewDate - a.viewDate);
            
            // Get unique viewers (latest view for each user)
            const uniqueViewers = new Map();
            sortedWhoView.forEach(view => {
                if (!uniqueViewers.has(view.userId._id.toString())) {
                    uniqueViewers.set(view.userId._id.toString(), {
                        username: view.userId.username,
                        viewDate: view.viewDate
                    });
                }
            });

            // Take the first 5 unique viewers
            whoViewData = Array.from(uniqueViewers.values()).slice(0, 5);
        }

        // Prepare the response data
        const responseData = {
            _id: user._id,
            username,
            biography,
            school: school ? { name: school.schoolName, type: school.schoolType } : null,
            faculty,
            uniqueViewers,
            birthday,
            interest,
            instagram,
            joinDate: user.createdAt,
            friendStatus,
            avatar,
            whoView: whoViewData,
            todaysClubs: isVip && !isOwnProfile ? todaysClubs.map(club => ({
                _id: club._id,
                clubName: club.clubName
            })) : undefined,
        };

        return res.json({ 
            data: responseData
        });

    } catch (err) {
        console.error("Error in profileView:", err);
        return res.status(500).json({ error: "Internal server error", details: err.message });
    }
};

const getWhoViewed = async (req, res) => {
    try {
        const userId = req.userId; // set by your authMiddleware

        const account = await Account.findOne({ userId })
            .select('whoView')
            .populate('whoView.userId', 'username');

        if (!account) {
            return res.status(404).json({ message: "Account not found" });
        }

        const whoViewedData = account.whoView.map(view => ({
            username: view.userId.username,
            viewDate: view.viewDate
        })).sort((a, b) => b.viewDate - a.viewDate); // Sort by most recent view

        return res.json({ data: whoViewedData });

    } catch (err) {
        console.error("Error in getWhoViewed:", err);
        return res.status(500).json({ error: "Internal server error" });
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

        // Send notification for the friend request
        await notificationController.sendFriendRequestNotification(userId, friendId);

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

        console.log(`Accepting friend request: user ${userId}, friend ${friendId}`);

        // Find the accounts of both users
        const userAccount = await Account.findOne({ userId });
        const friendAccount = await Account.findOne({ userId: friendId });

        if (!userAccount || !friendAccount) {
            console.log("User or friend account not found");
            return res.status(404).json({ message: "User not found" });
        }

        // Check if the friend request exists in the user's receivedFriendRequest
        const receivedRequestIndex = userAccount.receivedFriendRequest.findIndex(request => request.userId.toString() === friendId);

        console.log(`Received request index: ${receivedRequestIndex}`);

        if (receivedRequestIndex === -1) {
            console.log("Friend request not found in user's receivedFriendRequest");
            return res.status(400).json({ message: "Friend request not found" });
        }

        // Remove the friend request from user's receivedFriendRequest
        userAccount.receivedFriendRequest.splice(receivedRequestIndex, 1);

        // Check and remove from friend's sentFriendRequest if it exists
        const sentRequestIndex = friendAccount.sentFriendRequest.findIndex(request => request.userId.toString() === userId);
        if (sentRequestIndex !== -1) {
            friendAccount.sentFriendRequest.splice(sentRequestIndex, 1);
        }

        // Add each other to friends list
        userAccount.friendsList.push({ friendId: friendAccount.userId });
        friendAccount.friendsList.push({ friendId: userAccount.userId });

        await userAccount.save();
        await friendAccount.save();

        // Send notification for accepted friend request
        try {
            const notification = await notificationController.sendFriendAddedNotification(userId, friendId);
            console.log("Friend added notification sent:", notification);
        } catch (notificationError) {
            console.error("Failed to send friend added notification:", notificationError);
        }

        console.log("Friend request accepted successfully");
        res.status(200).json({ message: "Friend request accepted successfully" });
    } catch (error) {
        console.error("Error accepting friend request:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

const unfriend = async (req, res) => {
    try {
        const userId = req.userId;
        const friendId = req.params.friendId;

        // Find both user accounts
        const userAccount = await Account.findOne({ userId });
        const friendAccount = await Account.findOne({ userId: friendId });

        if (!userAccount || !friendAccount) {
            return res.status(404).json({ message: "User not found" });
        }

        // Remove friendId from userId's friends list
        userAccount.friendsList = userAccount.friendsList.filter(friend => friend.friendId.toString() !== friendId);

        // Remove userId from friendId's friends list
        friendAccount.friendsList = friendAccount.friendsList.filter(friend => friend.friendId.toString() !== userId);

        // Save the updated accounts
        await userAccount.save();
        await friendAccount.save();

        return res.status(200).json({ message: 'Friend removed successfully' });
    } catch (err) {
        console.error("Error unfriending:", err);
        return res.status(500).json({ message: "Internal server error", error: err.message });
    }
};


module.exports = {
    getUserMe,
    uploadAvatar,
    getAllSchools,
    updateAccount,
    getUser,
    profileView,
    getWhoViewed,
    addFriend,
    acceptFriendRequest,
    unfriend
}