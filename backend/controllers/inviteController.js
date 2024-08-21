const mongoose = require('mongoose');
const crypto = require('crypto');
const { InviteCard } = require('../models/inviteCard.model'); // Adjust the path as needed
const { User, Account } = require('../models/user.model'); // Adjust the path as needed
const { Club } = require('../models/club.model'); // Adjust the path as needed

// Function to generate a unique invite link
const generateInviteLink = () => {
    return crypto.randomBytes(16).toString('hex');
};

// Function to send an invite
const postSendInvite = async (req, res) => {
    try {
        const { clubId } = req.body;
        const userId = req.userId; // Assuming this is set by your authMiddleware

        // Validate clubId
        if (!mongoose.Types.ObjectId.isValid(clubId)) {
            return res.status(400).json({ error: "Invalid club ID" });
        }

        // Check if the club exists
        const club = await Club.findById(clubId);
        if (!club) {
            return res.status(400).json({ error: "Club not found" });
        }

        // Generate a unique invite link
        const inviteLink = generateInviteLink();

        // Set expiration time to 12 hours from now
        const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000);

        // Create a new invite
        const newInvite = new InviteCard({
            userId,
            inviteLink,
            club: clubId,
            inviteDate: new Date(),
            expiresAt,
            accepted: [] // Initialize with an empty array
        });

        await newInvite.save();

        // Generate the full invite URL (replace with your actual frontend URL)
        const inviteUrl = `https://tysm.social/invite/${inviteLink}`;

        res.status(201).json({
            message: "Invite created successfully",
            inviteUrl,
            expiresAt
        });

    } catch (error) {
        console.error("Error in postSendInvite:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// Function to get invite details
const getInviteDetails = async (req, res) => {
    try {
        const { inviteLink } = req.params;

        const invite = await InviteCard.findOne({ inviteLink })
            .populate('userId', 'username')
            .populate('club', 'clubName')
            .populate('accepted', 'username');

        if (!invite) {
            return res.status(404).json({ error: "Invite not found" });
        }

        // Check if the invite has expired
        if (invite.expiresAt < new Date()) {
            return res.status(410).json({ error: "Invite has expired" });
        }

        const acceptedUsers = await Promise.all(invite.accepted.map(async (user) => {
            const account = await Account.findOne({ userId: user._id }).populate('school', 'schoolName');
            return {
                username: user.username,
                schoolName: account?.school?.schoolName || null
            };
        }));

        res.json({
            from: invite.userId.username,
            clubName: invite.club.clubName,
            date: invite.inviteDate,
            expiresAt: invite.expiresAt,
            acceptedUsers: acceptedUsers
        });

    } catch (error) {
        console.error("Error in getInviteDetails:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// Function to respond to an invite
const respondToInvite = async (req, res) => {
    try {
        const { inviteLink } = req.body;
        const userId = req.userId; // Will be undefined for non-logged-in users

        const invite = await InviteCard.findOne({ inviteLink });
        if (!invite) {
            return res.status(404).json({ error: "Invite not found" });
        }

        // Check if the invite has expired
        if (invite.expiresAt < new Date()) {
            return res.status(410).json({ error: "Invite has expired" });
        }

        if (!userId) {
            // User is not logged in, redirect to registration
            return res.json({ redirect: '/register', inviteLink });
        }

        // Check if user has already accepted this invite
        if (invite.accepted.includes(userId)) {
            return res.status(400).json({ error: "You've already accepted this invite" });
        }

        // Add user to the accepted list
        invite.accepted.push(userId);
        await invite.save();

        // Add user to the club's goingToday list
        await Club.findByIdAndUpdate(invite.club, {
            $addToSet: { goingToday: { userId } },
            $inc: { todayCount: 1 }
        });

        res.json({ message: "You're going to the club!" });

    } catch (error) {
        console.error("Error in respondToInvite:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

module.exports = {
    InviteCard,
    postSendInvite,
    getInviteDetails,
    respondToInvite
};