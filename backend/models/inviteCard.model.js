const mongoose = require("mongoose");

const inviteCardSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    inviteLink: {
        type: String,
        required: true,
        unique: true
    },
    club: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Club",
        required: true
    },
    inviteDate: {
        type: Date,
        default: Date.now
    },
    expiresAt: {
        type: Date,
        required: true
    },
    accepted: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
});

const InviteCard = mongoose.model("InviteCard", inviteCardSchema);

module.exports = {
    InviteCard
};