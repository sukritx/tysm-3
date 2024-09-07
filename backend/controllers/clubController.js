const mongoose = require("mongoose");
const { Account } = require("../models/user.model");
const { Club } = require("../models/club.model");
const { Province } = require("../models/province.model");

const getClubs = async (req, res) => {
    try {
        const { province } = req.query;

        if (!province) {
            return res.status(400).json({ message: "Province is required" });
        }

        // First, find the province document
        const provinceDoc = await Province.findOne({ province });

        if (!provinceDoc) {
            return res.status(404).json({ message: "Province not found" });
        }

        const clubs = await Club.find({ province: provinceDoc._id })
            .sort({ todayCount: -1 })
            .select('clubName province todayCount')
            .populate('province', 'name')  // Populate the province field
            .lean();

        res.json(clubs);
    } catch (error) {
        console.error("Error in getClubs:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

const getPeopleGoingToday = async (req, res) => {
    try {
        const { clubId } = req.params;
        const userId = req.userId;

        if (!mongoose.Types.ObjectId.isValid(clubId)) {
            return res.status(400).json({ error: "Invalid club ID" });
        }

        const club = await Club.findById(clubId).populate('goingToday.userId');
        if (!club) {
            return res.status(404).json({ error: "Club not found" });
        }

        const userAccount = await Account.findOne({ userId: userId });
        if (!userAccount) {
            return res.status(404).json({ error: "User account not found" });
        }

        const friendIds = new Set(userAccount.friendsList.map(friend => friend.friendId.toString()));

        const peopleGoingData = await Promise.all(club.goingToday.map(async (person) => {
            const personAccount = await Account.findOne({ userId: person.userId._id })
                .populate('school');

            let schoolInfo = null;
            if (personAccount && personAccount.school) {
                schoolInfo = {
                    id: personAccount.school._id,
                    name: personAccount.school.schoolName,
                    type: personAccount.school.schoolType
                };
            }

            return {
                userId: person.userId._id,
                username: person.userId.username,
                ig: personAccount ? personAccount.instagram : null,
                avatar: personAccount ? personAccount.avatar : null,
                school: schoolInfo,
                isFriend: friendIds.has(person.userId._id.toString())
            };
        }));

        // Sort the list: friends first, then others
        peopleGoingData.sort((a, b) => {
            if (a.isFriend && !b.isFriend) return -1;
            if (!a.isFriend && b.isFriend) return 1;
            return 0;
        });

        res.json({
            clubName: club.clubName,
            totalGoingToday: club.todayCount,
            friendsGoingCount: peopleGoingData.filter(person => person.isFriend).length,
            peopleGoing: peopleGoingData
        });

    } catch (error) {
        console.error("Error in getPeopleGoingToday:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

const addClub = async (req, res) => {
    try {
        const { clubName, province } = req.body;

        // Validate input
        if (!clubName || !province) {
            return res.status(400).json({ message: "Club name and province are required" });
        }

        // Check if the province exists
        const provinceDoc = await Province.findOne({ province: province });
        if (!provinceDoc) {
            return res.status(404).json({ message: "Province not found" });
        }

        // Check if a club with the same name already exists in the province
        const existingClub = await Club.findOne({ clubName, province: provinceDoc._id });
        if (existingClub) {
            return res.status(409).json({ message: "A club with this name already exists in the province" });
        }

        // Create new club
        const newClub = new Club({
            clubName,
            province: provinceDoc._id,
            goingToday: [],
            todayCount: 0
        });

        // Save the new club
        await newClub.save();

        // Return the created club
        res.status(201).json({
            message: "Club created successfully",
            club: {
                _id: newClub._id,
                clubName: newClub.clubName,
                province: provinceDoc.province,
                todayCount: newClub.todayCount
            }
        });

    } catch (error) {
        console.error("Error in addClub:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

const goToClub = async (req, res) => {
    try {
        const { clubId } = req.params;
        const userId = req.userId;

        if (!mongoose.Types.ObjectId.isValid(clubId)) {
            return res.status(400).json({ message: "Invalid club ID" });
        }

        const club = await Club.findById(clubId);
        if (!club) {
            return res.status(404).json({ message: "Club not found" });
        }

        // Check if the user is already going to this club today
        const alreadyGoing = club.goingToday.some(person => person.userId.toString() === userId);
        if (alreadyGoing) {
            return res.status(400).json({ message: "You're already going to this club today" });
        }

        // Add user to goingToday array and increment todayCount
        club.goingToday.push({ userId });
        club.todayCount += 1;

        await club.save();

        res.status(200).json({
            message: "Successfully added to club's going today list",
            clubName: club.clubName,
            todayCount: club.todayCount
        });

    } catch (error) {
        console.error("Error in goToClub:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

const undoGoToClub = async (req, res) => {
    try {
        const { clubId } = req.params;
        const userId = req.userId;

        console.log(`Attempting to undo go for club ${clubId} and user ${userId}`);

        if (!mongoose.Types.ObjectId.isValid(clubId)) {
            console.log('Invalid club ID');
            return res.status(400).json({ message: "Invalid club ID" });
        }

        const club = await Club.findById(clubId);
        if (!club) {
            console.log('Club not found');
            return res.status(404).json({ message: "Club not found" });
        }

        console.log('Club found:', JSON.stringify(club, null, 2));

        // Check if the user is in the goingToday array
        const userIndex = club.goingToday.findIndex(person => person.userId.toString() === userId.toString());
        console.log('User index in goingToday:', userIndex);
        console.log('goingToday array:', JSON.stringify(club.goingToday, null, 2));
        console.log('Comparing userId:', userId, 'with type:', typeof userId);
        club.goingToday.forEach((person, index) => {
            console.log(`goingToday[${index}].userId:`, person.userId, 'with type:', typeof person.userId);
        });

        if (userIndex === -1) {
            console.log('User not found in goingToday list');
            return res.status(400).json({ message: "You're not in the going today list for this club" });
        }

        // Remove user from goingToday array and decrement todayCount
        club.goingToday.splice(userIndex, 1);
        club.todayCount = Math.max(0, club.todayCount - 1); // Ensure todayCount doesn't go below 0

        console.log('Updated club:', JSON.stringify(club, null, 2));

        await club.save();

        console.log('Club saved successfully');

        res.status(200).json({
            message: "Successfully removed from club's going today list",
            clubName: club.clubName,
            todayCount: club.todayCount
        });

    } catch (error) {
        console.error("Error in undoGoToClub:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

module.exports = {
    getClubs,
    getPeopleGoingToday,
    addClub,
    goToClub,
    undoGoToClub
}