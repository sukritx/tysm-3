const mongoose = require("mongoose");

const fakbokCommunitySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String },
  rules: [{ type: String }],
  logo: { type: String },
  banner: { type: String },
  moderators: { type: [mongoose.Schema.Types.ObjectId], ref: 'User', required: false },
  followers: { type: [mongoose.Schema.Types.ObjectId], ref: 'User', default: [] },
  followersCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Add middleware to update followersCount when followers array changes
fakbokCommunitySchema.pre('save', function(next) {
  if (this.isModified('followers')) {
    this.followersCount = this.followers.length;
  }
  this.updatedAt = new Date();
  next();
});

// Add method to check if a user is following
fakbokCommunitySchema.methods.isFollowedByUser = function(userId) {
  return this.followers.includes(userId);
};

const fakbokCommunity = mongoose.model("fakbokCommunity", fakbokCommunitySchema);

module.exports = {
  fakbokCommunity
};