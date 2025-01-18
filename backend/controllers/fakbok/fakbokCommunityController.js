const mongoose = require('mongoose');
const { fakbokCommunity } = require('../../models/fakbok/fakbokCommunity.model');

// Create a new community
const createCommunity = async (req, res) => {
    try {
        const { name } = req.body;
        const community = new fakbokCommunity({ name });
        await community.save();
        res.status(201).json(community);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Get all communities
const getAllCommunities = async (req, res) => {
    try {
        const communities = await fakbokCommunity.find();
        res.json(communities);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get a specific community by ID
const getCommunityById = async (req, res) => {
    try {
        const community = await fakbokCommunity.findById(req.params.id);
        if (!community) return res.status(404).json({ error: 'Community not found' });
        res.json(community);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update a community
const updateCommunity = async (req, res) => {
    try {
        const { name } = req.body;
        const community = await fakbokCommunity.findByIdAndUpdate(req.params.id, { name }, { new: true });
        if (!community) return res.status(404).json({ error: 'Community not found' });
        res.json(community);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Delete a community
const deleteCommunity = async (req, res) => {
    try {
        const community = await fakbokCommunity.findByIdAndDelete(req.params.id);
        if (!community) return res.status(404).json({ error: 'Community not found' });
        res.json({ message: 'Community deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Follow a community
const followCommunity = async (req, res) => {
    try {
        const community = await fakbokCommunity.findById(req.params.id);
        if (!community) return res.status(404).json({ error: 'Community not found' });
        community.followersCount += 1;
        await community.save();
        res.json(community);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Unfollow a community
const unfollowCommunity = async (req, res) => {
    try {
        const community = await fakbokCommunity.findById(req.params.id);
        if (!community) return res.status(404).json({ error: 'Community not found' });
        if (community.followersCount > 0) {
            community.followersCount -= 1;
        }
        await community.save();
        res.json(community);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    createCommunity,
    getAllCommunities,
    getCommunityById,
    updateCommunity,
    deleteCommunity,
    followCommunity,
    unfollowCommunity
};