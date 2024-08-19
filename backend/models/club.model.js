const mongoose = require("mongoose");
const { User } = require("./user.model");

const clubSchema = new mongoose.Schema({
    clubName: {
        type: String,
        required: true,
        trim: true,
    },
    province: {
        type: String,
        required: true,
        trim: true,
    },
    goingToday: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    }],
});

const Club = mongoose.model("Club", clubSchema);

module.exports = {
    Club
};