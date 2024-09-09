const { User } = require("../models/user.model");
const { Message } = require("../models/message.model");
const { Account } = require("../models/user.model");
const zod = require("zod");
const mongoose = require('mongoose');

const sendMessage = async (req, res) => {
    try {
        const senderId = req.userId;
        const receiverId = req.params.id;
        const { message } = req.body;

        // console.log("Sending message:", { senderId, receiverId, message });

        // Check if both sender and receiver exist
        const sender = await User.findById(senderId);
        const receiver = await User.findById(receiverId);
        if (!sender || !receiver) {
            return res.status(404).json({
                message: "Sender or receiver not found"
            });
        }

        // Check if sender has enough coins
        const senderAccount = await Account.findOne({ userId: senderId });
        if (senderAccount.coin.balance < 1) {
            return res.status(400).json({
                message: "Insufficient coins to send message",
                errorCode: "INSUFFICIENT_COINS"
            });
        }

        // Deduct 1 coin from sender
        senderAccount.coin.balance -= 1;
        senderAccount.coin.transactions.push({
            amount: -1,
            type: 'spend',
            reason: 'Sent message'
        });
        await senderAccount.save();

        // Create and save the message
        const newMessage = new Message({
            sender: senderId,
            receiver: receiverId,
            message: message
        });

        await newMessage.save();
        // console.log("Message saved successfully:", newMessage);

        res.status(200).json({
            message: "Message sent successfully"
        });
    } catch (error) {
        console.error("Error sending message:", error);
        res.status(500).json({
            message: "Internal server error"
        });
    }
};

const getUnreadMessageCount = async (req, res) => {
    try {
        const userId = req.userId;
        const count = await Message.countDocuments({ receiver: userId, read: false });
        res.status(200).json({ unreadCount: count });
    } catch (error) {
        console.error("Error getting unread message count:", error);
        res.status(500).json({
            message: "Internal server error"
        });
    }
};

const getMessageSameUser = async (req, res) => {
    try {
        const userId = req.userId;
        const otherUserId = req.params.id;

        const messages = await Message.find({
            $or: [
                { sender: userId, receiver: otherUserId },
                { sender: otherUserId, receiver: userId }
            ]
        }).sort({ createdAt: 1 });

        if (!messages || messages.length === 0) {
            return res.status(404).json({
                message: "No messages found between the users"
            });
        }

        const formattedMessages = messages.map(message => ({
            _id: message._id,
            isFromCurrentUser: message.sender.toString() === userId,
            message: message.message,
            createdAt: message.createdAt,
            read: message.read
        }));

        // console.log('Formatted messages:', formattedMessages);

        res.status(200).json(formattedMessages);
    } catch (error) {
        console.error("Error fetching messages between users:", error);
        res.status(500).json({
            message: "Internal server error"
        });
    }
}

const getConversations = async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.userId);
        // console.log("Fetching conversations for user:", userId);

        const conversations = await Message.aggregate([
            {
                $match: {
                    $or: [{ sender: userId }, { receiver: userId }]
                }
            },
            {
                $sort: { createdAt: -1 }
            },
            {
                $group: {
                    _id: {
                        $cond: [
                            { $eq: ['$sender', userId] },
                            '$receiver',
                            '$sender'
                        ]
                    },
                    lastMessage: { $first: '$message' },
                    createdAt: { $first: '$createdAt' }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'userDetails'
                }
            },
            {
                $unwind: '$userDetails'
            },
            {
                $lookup: {
                    from: 'accounts',
                    localField: '_id',
                    foreignField: 'userId',
                    as: 'accountDetails'
                }
            },
            {
                $unwind: '$accountDetails'
            },
            {
                $project: {
                    userId: '$_id',
                    username: '$userDetails.username',
                    avatar: '$accountDetails.avatar',
                    lastMessage: 1,
                    createdAt: 1
                }
            },
            {
                $sort: { createdAt: -1 }
            }
        ]);

        // console.log("Conversations found:", JSON.stringify(conversations, null, 2));

        res.status(200).json({ conversations });
    } catch (error) {
        console.error("Error getting conversations:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

const markMessagesAsRead = async (req, res) => {
    try {
        const userId = req.userId;
        const otherUserId = req.params.id;

        const updatedMessages = await Message.updateMany(
            { sender: otherUserId, receiver: userId, read: false },
            { $set: { read: true } }
        );

        // console.log(`Marked ${updatedMessages.modifiedCount} messages as read`);

        res.status(200).json({ message: "Messages marked as read", updatedCount: updatedMessages.modifiedCount });
    } catch (error) {
        console.error("Error marking messages as read:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

module.exports = {
    sendMessage,
    getMessageSameUser,
    getUnreadMessageCount,
    getConversations,
    markMessagesAsRead
}

