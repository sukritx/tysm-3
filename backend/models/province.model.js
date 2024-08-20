const mongoose = require("mongoose");

const provinceSchema = new mongoose.Schema({
    province: {
        type: String,
        required: true,
        trim: true,
    },
    provinceFull: {
        type: String,
        required: true,
        trim: true,
    },
});

const Province = mongoose.model("Province", provinceSchema);

module.exports = {
    Province
};