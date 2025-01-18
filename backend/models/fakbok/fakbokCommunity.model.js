const mongoose = require("mongoose");

const fakbokCommunitySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  followersCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const fakbokCommunity = mongoose.model("Community", fakbokCommunitySchema);

module.exports = {
  fakbokCommunity
};