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
        const communities = await fakbokCommunity.find()
            .populate('moderators', 'username avatar');

        // Convert communities to objects and add custom fields
        const communitiesWithFlags = communities.map(community => {
            const communityObj = community.toObject();
            
            // Add isJoined flag if user is authenticated
            communityObj.isJoined = false;
            if (req.user) {
                communityObj.isJoined = community.followers.includes(req.user._id);
            }
            
            communityObj.memberCount = community.followersCount;
            return communityObj;
        });

        res.json(communitiesWithFlags);
    } catch (error) {
        console.error('Error getting communities:', error);
        res.status(500).json({ error: error.message });
    }
};

// Get a specific community by ID
const getCommunityById = async (req, res) => {
    try {
        const community = await fakbokCommunity.findById(req.params.id)
            .populate('moderators', 'username avatar');

        if (!community) {
            return res.status(404).json({ error: 'Community not found' });
        }

        // Convert to object and add custom fields
        const communityObj = community.toObject();
        
        // Add isJoined flag if user is authenticated
        communityObj.isJoined = false;
        if (req.user) {
            communityObj.isJoined = community.followers.includes(req.user._id);
        }

        communityObj.memberCount = community.followersCount;
        
        res.json(communityObj);
    } catch (error) {
        console.error('Error getting community:', error);
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
        const community = await fakbokCommunity.findById(req.params.id)
            .populate('moderators', 'username avatar');
        if (!community) return res.status(404).json({ error: 'Community not found' });

        const userId = req.user._id;
        
        // Check if user is already a follower
        if (community.followers.includes(userId)) {
            return res.status(400).json({ error: 'Already a member of this community' });
        }

        // Add user to followers
        community.followers.push(userId);
        await community.save();

        // Return updated community with isJoined flag
        const updatedCommunity = community.toObject();
        updatedCommunity.isJoined = true;
        updatedCommunity.memberCount = community.followersCount;

        res.json(updatedCommunity);
    } catch (error) {
        console.error('Error joining community:', error);
        res.status(500).json({ error: 'Failed to join community' });
    }
};

// Leave a community
const leaveCommunity = async (req, res) => {
    try {
        const community = await fakbokCommunity.findById(req.params.id)
            .populate('moderators', 'username avatar');
        if (!community) return res.status(404).json({ error: 'Community not found' });

        const userId = req.user._id;
        
        // Check if user is a follower
        if (!community.followers.includes(userId)) {
            return res.status(400).json({ error: 'Not a member of this community' });
        }

        // Remove user from followers
        community.followers = community.followers.filter(id => !id.equals(userId));
        await community.save();

        // Return updated community with isJoined flag
        const updatedCommunity = community.toObject();
        updatedCommunity.isJoined = false;
        updatedCommunity.memberCount = community.followersCount;

        res.json(updatedCommunity);
    } catch (error) {
        console.error('Error leaving community:', error);
        res.status(500).json({ error: 'Failed to leave community' });
    }
};

// Get a community
const getCommunity = async (req, res) => {
    try {
        const community = await fakbokCommunity.findById(req.params.id)
            .populate('moderators', 'username avatar');
        
        if (!community) return res.status(404).json({ error: 'Community not found' });

        // Convert to object to add custom fields
        const communityObj = community.toObject();
        
        // Add isJoined flag if user is authenticated
        if (req.user) {
            communityObj.isJoined = community.isFollowedByUser(req.user._id);
        }
        
        communityObj.memberCount = community.followersCount;

        res.json(communityObj);
    } catch (error) {
        console.error('Error getting community:', error);
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
    getCommunity,
    searchCommunities
};