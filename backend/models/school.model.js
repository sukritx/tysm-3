const mongoose = require("mongoose");
const { User } = require("./user.model");

const schoolSchema = new mongoose.Schema({
    schoolName: {
        type: String,
        required: true,
        trim: true,
        maxLength: 250
    },
    schoolType: {
        type: String,
        enum: ["school", "university"]
    },
    members: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'User',
        required: true
    },
    memberCount: {
        type: Number,
        default: 0
    },
});

const School = mongoose.model("School", schoolSchema);

module.exports = {
    School
};