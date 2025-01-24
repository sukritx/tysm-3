const mongoose = require("mongoose");

const fakbokNotificationSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, required: true },
    reference_id: { type: mongoose.Schema.Types.ObjectId },
    message: { type: String, required: true },
    is_read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

const fakbokNotification = mongoose.model("fakbokNotification", fakbokNotificationSchema);

module.exports = {
    fakbokNotification
};
