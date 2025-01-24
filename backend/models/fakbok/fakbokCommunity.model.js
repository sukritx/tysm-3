const mongoose = require("mongoose");

const fakbokCommunitySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String },
  rules: { type: String },
  logo: { type: String },
  banner: { type: String },
  moderators: { type: [mongoose.Schema.Types.ObjectId], ref: 'User', required: false },
  followersCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const fakbokCommunity = mongoose.model("fakbokCommunity", fakbokCommunitySchema);

module.exports = {
  fakbokCommunity
};