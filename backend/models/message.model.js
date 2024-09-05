const mongoose = require("mongoose");
const { User } = require("./user.model");

const messageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    message: {
        type: String,
        required: true,
        trim: true,
        maxLength: 500
    },
    read: {
        type: Boolean,
        default: false
    },
}, { timestamps: true });  // This will add createdAt and updatedAt fields

const Message = mongoose.model("Message", messageSchema);

module.exports = {
    Message
};