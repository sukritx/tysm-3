const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false  // Not required for system notifications
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    notificationType: {
        type: String,
        enum: ["receivedFriendRequest", "friendAdded", "incomingChat", "vipPurchase", "newComment", "mentionedInComment"],
        required: true
    },
    message: {
        type: String,
        required: true
    },
    read: {
        type: Boolean,
        default: false
    },
    relatedPost: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post'
    },
    relatedComment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
})

const Notification = mongoose.model("Notification", notificationSchema);

module.exports = {
    Notification
}