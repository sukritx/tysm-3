const { Notification } = require('../models/notification.model');

const notificationController = {
  // Send a notification when a friend request is sent
  sendFriendRequestNotification: async (senderId, receiverId) => {
    try {
      // console.log(`Attempting to create friend request notification: sender ${senderId}, receiver ${receiverId}`);
      
      const newNotification = new Notification({
        sender: senderId,
        receiver: receiverId,
        notificationType: "receivedFriendRequest",
        message: "You have received a new friend request!"
      });

      const savedNotification = await newNotification.save();
      // console.log("Friend request notification created successfully:", savedNotification);
      return savedNotification;
    } catch (error) {
      console.error("Error creating friend request notification:", error);
      throw error; // Re-throw the error so it can be caught in the calling function
    }
  },

  // Send a notification when a friend request is accepted
  sendFriendAddedNotification: async (senderId, receiverId) => {
    try {
      // console.log(`Attempting to create friend added notification: sender ${senderId}, receiver ${receiverId}`);
      
      const newNotification = new Notification({
        sender: senderId,
        receiver: receiverId,
        notificationType: "friendAdded",
        message: "Your friend request has been accepted!"
      });

      const savedNotification = await newNotification.save();
      // console.log("Friend added notification created successfully:", savedNotification);
      return savedNotification;
    } catch (error) {
      console.error("Error creating friend added notification:", error);
      throw error; // Re-throw the error so it can be caught in the calling function
    }
  },

  // Get all unread notifications for a user
  getUnreadNotifications: async (req, res) => {
    try {
      const userId = req.userId;
      const unreadNotifications = await Notification.find({ receiver: userId, read: false })
        .populate('sender', 'username')
        .sort({ createdAt: -1 });

      res.status(200).json(unreadNotifications);
    } catch (error) {
      console.error("Error fetching unread notifications:", error);
      res.status(500).json({ message: "Internal server error", error: error.message });
    }
  },

  // Mark a notification as read
  markNotificationAsRead: async (req, res) => {
    try {
      const { notificationId } = req.params;
      const userId = req.userId;

      const notification = await Notification.findOneAndUpdate(
        { _id: notificationId, receiver: userId },
        { read: true },
        { new: true }
      );

      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }

      res.status(200).json({ message: "Notification marked as read", notification });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Internal server error", error: error.message });
    }
  },

  // Get all notifications for a user
  getAllNotifications: async (req, res) => {
    try {
      const userId = req.userId;
      const notifications = await Notification.find({ receiver: userId })
        .populate('sender', 'username')
        .sort({ createdAt: -1 });

      res.status(200).json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Internal server error", error: error.message });
    }
  },

  // Send a notification when VIP status is purchased
  sendVIPPurchaseNotification: async (userId) => {
    try {
      const newNotification = new Notification({
        receiver: userId,
        notificationType: "vipPurchase",
        message: "You have successfully purchased VIP status!"
      });

      await newNotification.save();
      // console.log("VIP purchase notification sent successfully");
    } catch (error) {
      console.error("Error sending VIP purchase notification:", error);
    }
  }
};

module.exports = {
  notificationController
};