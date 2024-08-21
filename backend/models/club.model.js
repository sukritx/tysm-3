const mongoose = require("mongoose");
const { User } = require("./user.model");
const { Province } = require("./province.model");

const clubSchema = new mongoose.Schema({
    clubName: {
        type: String,
        required: true,
        trim: true,
    },
    province: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Province',
        required: true
    },
    goingToday: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    }],
    todayCount: {
        type: Number,
        default: 0
    },
});

const Club = mongoose.model("Club", clubSchema);

module.exports = {
    Club
};