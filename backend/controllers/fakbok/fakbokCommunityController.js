const mongoose = require('mongoose');
const { fakbokCommunity } = require('../../models/fakbok/fakbokCommunity.model');

// Create a new community
const createCommunity = async (req, res) => {
    try {
        const { name, description, rules, logo, banner, moderators = [] } = req.body;
        const community = new fakbokCommunity({ 
            name, 
            description, 
            rules, 
            logo, 
            banner, 
            moderators 
        });
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
        const { name, description, rules, logo, banner, moderators } = req.body;
        const community = await fakbokCommunity.findByIdAndUpdate(req.params.id, { name, description, rules, logo, banner, moderators }, { new: true });
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

// Join a community
const joinCommunity = async (req, res) => {
    try {
        const community = await fakbokCommunity.findById(req.params.id);
        if (!community) return res.status(404).json({ error: 'Community not found' });
        // Logic to add user to community
        res.json({ message: 'Joined community' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Leave a community
const leaveCommunity = async (req, res) => {
    try {
        const community = await fakbokCommunity.findById(req.params.id);
        if (!community) return res.status(404).json({ error: 'Community not found' });
        // Logic to remove user from community
        res.json({ message: 'Left community' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Search communities
const searchCommunities = async (req, res) => {
    try {
        const { query } = req.query;
        if (!query) {
            // If no query, return popular communities (by follower count)
            const communities = await fakbokCommunity
                .find()
                .sort({ followersCount: -1 })
                .limit(5);
            return res.json(communities);
        }

        // Search by name or description containing the query (case-insensitive)
        const communities = await fakbokCommunity
            .find({
                $or: [
                    { name: { $regex: query, $options: 'i' } },
                    { description: { $regex: query, $options: 'i' } }
                ]
            })
            .sort({ followersCount: -1 }) // Sort by popularity
            .limit(5); // Limit results

        res.json(communities);
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
    joinCommunity,
    leaveCommunity,
    searchCommunities
};