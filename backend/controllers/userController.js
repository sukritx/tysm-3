const { User } = require("../models/user.model");
const { Account } = require("../models/user.model");
const { School } = require("../models/school.model")
const { notificationController } = require('../controllers/notificationController');
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
        .select('biography school faculty whoView birthday interest instagram avatar')
        .populate('school', 'schoolName schoolType');
  
      const userInfo = {
        ...user.toObject(),
        ...(account ? account.toObject() : {}),
        uniqueViewers: account ? account.whoView.length : 0,
        id: user._id // Explicitly set the id to the User's _id
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
                    userId: "$userDetails._id"
                }
            }
        ]);

        res.json({
            users: users.map(user => ({
                _id: user._id,
                userId: user.userId,
                instagram: user.instagram,
                username: user.username
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
        const viewerId = req.userId; // set by your authMiddleware

        const user = await User.findOne({ username }).select('_id createdAt');

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const account = await Account.findOne({ userId: user._id })
            .select('biography school faculty whoView birthday interest instagram avatar')
            .populate('school', 'schoolName schoolType');

        if (!account) {
            return res.status(404).json({ message: "Account not found" });
        }

        const { biography, school, faculty, whoView, birthday, interest, instagram, avatar } = account;

        // If the viewer is not the profile owner, update the whoView array
        if (viewerId !== user._id.toString()) {
            const viewerAccount = await Account.findOne({ userId: viewerId });
            const isVip1 = viewerAccount && viewerAccount.vip && viewerAccount.vip.some(vip => vip.vipLevel === 1 && vip.vipExpire > new Date());

            if (!isVip1) {
                const alreadyViewed = whoView.some(view => view.userId.toString() === viewerId);
                if (!alreadyViewed) {
                    account.whoView.push({ userId: viewerId, viewDate: new Date() });
                } else {
                    const viewIndex = whoView.findIndex(view => view.userId.toString() === viewerId);
                    account.whoView[viewIndex].viewDate = new Date();
                }
                await account.save();
            }
        }

        // Count the number of unique viewers
        const uniqueViewers = new Set(whoView.map(view => view.userId.toString())).size;

        // Determine friend status
        let friendStatus = 'not_friends';
        const viewerAccount = await Account.findOne({ userId: viewerId });
        if (viewerAccount) {
            if (viewerAccount.friendsList.some(friend => friend.friendId.toString() === user._id.toString())) {
                friendStatus = 'friends';
            } else if (viewerAccount.sentFriendRequest.some(request => request.userId.toString() === user._id.toString())) {
                friendStatus = 'pending_sent';
            } else if (viewerAccount.receivedFriendRequest.some(request => request.userId.toString() === user._id.toString())) {
                friendStatus = 'pending_received';
            }
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
            avatar
        };

        return res.json({ 
            data: {
                ...responseData,
                friendStatus
            }
        });

    } catch (err) {
        console.error("Error in profileView:", err);
        return res.status(500).json({ error: "Internal server error" });
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

        // Send notification for accepted friend request
        await notificationController.sendFriendAddedNotification(userId, friendId);

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